import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'
import { ChatInterface } from '@/components/chat-interface'
import { mockApiResponse, mockApiError } from '@/test/utils'

// Mock all external dependencies
vi.mock('@/lib/ai/vercel-ai', () => ({
  generateChatResponse: vi.fn(),
}))

vi.mock('@/lib/models', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
  Conversation: {
    create: vi.fn(),
    findById: vi.fn(),
  },
  Message: {
    create: vi.fn(),
    save: vi.fn(),
  },
}))

vi.mock('@/lib/context-manager', () => ({
  getConversationContext: vi.fn().mockResolvedValue({
    messages: [],
    tokensUsed: 0,
    messagesTrimmed: 0,
  }),
}))

describe('Chat Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('completes full chat workflow from start to finish', async () => {
    // Mock conversation loading
    mockApiResponse({
      success: true,
      conversations: [],
    })

    // Mock chat API response
    mockApiResponse({
      id: 'msg-1',
      content: 'Hello! How can I help you today?',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversation_id: 'conv-1',
      model: 'gpt-4',
      usage: {
        totalTokens: 50,
        promptTokens: 20,
        completionTokens: 30,
      },
    })

      render(React.createElement(ChatInterface))

    // Wait for initial load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations')
    })

    // Send first message via example click
    const examplePrompt = screen.getByText('"Explain quantum computing in simple terms"')
    fireEvent.click(examplePrompt)

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"message":"Hello, AI!"'),
      }))
    })

    // Verify message appears in UI
    await waitFor(() => {
      expect(screen.getByText('Hello, AI!')).toBeInTheDocument()
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument()
    })
  })

  it('handles conversation continuation', async () => {
    // Mock existing conversation
    mockApiResponse({
      success: true,
      conversations: [
        {
          id: 'conv-1',
          title: 'Existing Conversation',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          messageCount: 5,
        },
      ],
    })

    // Mock chat API response for existing conversation
    mockApiResponse({
      id: 'msg-2',
      content: 'This is a follow-up response.',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversation_id: 'conv-1',
      model: 'gpt-4',
    })

      render(React.createElement(ChatInterface))

    // Send message to existing conversation via example click
    const examplePrompt = screen.getByText('"Explain quantum computing in simple terms"')
    fireEvent.click(examplePrompt)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"conversationId":"conv-1"'),
      }))
    })
  })

  it('handles multiple messages in sequence', async () => {
    mockApiResponse({
      success: true,
      conversations: [],
    })

    // Mock multiple API responses
    let callCount = 0
    ;(global.fetch as any).mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // First call - conversations
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, conversations: [] }),
        })
      } else {
        // Subsequent calls - chat
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: `msg-${callCount}`,
            content: `Response ${callCount}`,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            conversation_id: 'conv-1',
            model: 'gpt-4',
          }),
        })
      }
    })

      render(React.createElement(ChatInterface))

    // Send first message via example click
    const examplePrompt1 = screen.getByText('"Explain quantum computing in simple terms"')
    fireEvent.click(examplePrompt1)

    await waitFor(() => {
      expect(screen.getByText('Explain quantum computing in simple terms')).toBeInTheDocument()
      expect(screen.getByText('Response 2')).toBeInTheDocument()
    })

    // Send second message via chat input since example prompts are no longer visible
    const messageInput = screen.getByTestId('message-input')
    fireEvent.change(messageInput, { target: { value: 'Write a Python script for data analysis' } })
    fireEvent.keyDown(messageInput, { key: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Write a Python script for data analysis')).toBeInTheDocument()
      expect(screen.getByText('Response 3')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApiResponse({
      success: true,
      conversations: [],
    })

    // Mock API error
    mockApiError('Internal Server Error', 500)

      render(React.createElement(ChatInterface))

    const examplePrompt = screen.getByText('"Explain quantum computing in simple terms"')
    fireEvent.click(examplePrompt)

    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error while processing your message. Please try again.')).toBeInTheDocument()
    })
  })

  it('shows loading state during API calls', async () => {
    mockApiResponse({
      success: true,
      conversations: [],
    })

    // Mock delayed response
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/conversations') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, conversations: [] }),
        })
      }
      return promise
    })

      render(React.createElement(ChatInterface))

    const examplePrompt = screen.getByText('"Explain quantum computing in simple terms"')
    fireEvent.click(examplePrompt)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({
        id: 'msg-1',
        content: 'Test response',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        conversation_id: 'conv-1',
        model: 'gpt-4',
      }),
    })

    // Loading should disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
    })
  })

  it('handles example prompt clicks', async () => {
    mockApiResponse({
      success: true,
      conversations: [],
    })

    mockApiResponse({
      id: 'msg-1',
      content: 'Quantum computing is a revolutionary approach to computation...',
      role: 'assistant',
      timestamp: new Date().toISOString(),
      conversation_id: 'conv-1',
      model: 'gpt-4',
    })

      render(React.createElement(ChatInterface))

    // Click on example prompt
    const examplePrompt = screen.getByText('"Explain quantum computing in simple terms"')
    fireEvent.click(examplePrompt)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"message":"Explain quantum computing in simple terms"'),
      }))
    })

    await waitFor(() => {
      expect(screen.getByText('Explain quantum computing in simple terms')).toBeInTheDocument()
      expect(screen.getByText('Quantum computing is a revolutionary approach to computation...')).toBeInTheDocument()
    })
  })
})
