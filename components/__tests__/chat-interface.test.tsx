import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@/test/utils'
import { ChatInterface } from '../chat-interface'
import { mockApiResponse, mockApiError } from '@/test/utils'

// Mock the MessageList and ChatInput components
vi.mock('../message-list', () => ({
  MessageList: ({ messages, isLoading, onEditMessage, onRegenerateResponse }: any) => (
    <div data-testid="message-list">
      {messages.map((message: any) => (
        <div key={message.id} data-testid={`message-${message.id}`}>
          <span data-testid={`message-role-${message.id}`}>{message.role}</span>
          <span data-testid={`message-content-${message.id}`}>{message.content}</span>
          {message.attachments && (
            <div data-testid={`message-attachments-${message.id}`}>
              {message.attachments.length} attachments
            </div>
          )}
        </div>
      ))}
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
    </div>
  ),
}))

vi.mock('../chat-input', () => ({
  ChatInput: ({ onSendMessage, disabled }: any) => (
    <div data-testid="chat-input">
      <input
        data-testid="message-input"
        placeholder="Type your message..."
        disabled={disabled}
        onKeyDown={(e: any) => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            onSendMessage(e.target.value)
            e.target.value = ''
          }
        }}
      />
      <button
        data-testid="send-button"
        onClick={() => {
          const input = document.querySelector('[data-testid="message-input"]') as HTMLInputElement
          if (input?.value.trim()) {
            onSendMessage(input.value)
            input.value = ''
          }
        }}
        disabled={disabled}
      >
        Send
      </button>
    </div>
  ),
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockClear()
  })

  it('renders welcome screen when no messages', () => {
    render(<ChatInterface />)
    
    expect(screen.getByText('ChatGPT')).toBeInTheDocument()
    expect(screen.getByText('Examples')).toBeInTheDocument()
    expect(screen.getByText('Capabilities')).toBeInTheDocument()
    expect(screen.getByText('Limitations')).toBeInTheDocument()
    expect(screen.getByText('Use Cases')).toBeInTheDocument()
  })

  it('renders example prompts that are clickable', () => {
    render(<ChatInterface />)
    
    const examplePrompt = screen.getByText('"Explain quantum computing in simple terms"')
    expect(examplePrompt).toBeInTheDocument()
    
    const useCasePrompt = screen.getByText('"Write a Python script for data analysis"')
    expect(useCasePrompt).toBeInTheDocument()
  })

  it('sends a message when example is clicked', async () => {
    mockApiResponse({
      id: 'test-response-id',
      content: 'Test AI response',
      conversation_id: 'test-conversation-id',
      model: 'gpt-4',
    })

    render(<ChatInterface />)
    
    const examplePrompt = screen.getByText('"Explain quantum computing in simple terms"')
    
    await act(async () => {
      fireEvent.click(examplePrompt)
    })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"message":"Explain quantum computing in simple terms"'),
      }))
    })
  })

  it('sends a message via chat input', async () => {
    mockApiResponse({
      id: 'test-response-id',
      content: 'Test AI response',
      conversation_id: 'test-conversation-id',
      model: 'gpt-4',
    })

    render(<ChatInterface />)
    
    const messageInput = screen.getByTestId('message-input')
    const sendButton = screen.getByTestId('send-button')
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'Hello, AI!' } })
      fireEvent.click(sendButton)
    })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"message":"Hello, AI!"'),
      }))
    })
  })

  it('sends a message via Enter key', async () => {
    mockApiResponse({
      id: 'test-response-id',
      content: 'Test AI response',
      conversation_id: 'test-conversation-id',
      model: 'gpt-4',
    })

    render(<ChatInterface />)
    
    const messageInput = screen.getByTestId('message-input')
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'Hello, AI!' } })
      fireEvent.keyDown(messageInput, { key: 'Enter' })
    })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"message":"Hello, AI!"'),
      }))
    })
  })

  it('displays loading state while sending message', async () => {
    // Mock a delayed response
    let resolvePromise: (value: any) => void
    const promise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    ;(global.fetch as any).mockReturnValue(promise)

    render(<ChatInterface />)
    
    const messageInput = screen.getByTestId('message-input')
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'Test message' } })
      fireEvent.keyDown(messageInput, { key: 'Enter' })
    })
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })
    
    // Resolve the promise
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-response-id',
          content: 'Test AI response',
          conversation_id: 'test-conversation-id',
          model: 'gpt-4',
        }),
      })
    })
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    mockApiError('API Error', 500)

    render(<ChatInterface />)
    
    const messageInput = screen.getByTestId('message-input')
    
    await act(async () => {
      fireEvent.change(messageInput, { target: { value: 'Test message' } })
      fireEvent.keyDown(messageInput, { key: 'Enter' })
    })
    
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error while processing your message. Please try again.')).toBeInTheDocument()
    })
  })

  it('loads conversations on mount', async () => {
    mockApiResponse({
      success: true,
      conversations: [
        { id: 'conv-1', title: 'Test Conversation 1', createdAt: '2024-01-01', updatedAt: '2024-01-01', messageCount: 5 },
        { id: 'conv-2', title: 'Test Conversation 2', createdAt: '2024-01-02', updatedAt: '2024-01-02', messageCount: 3 },
      ],
    })

    render(<ChatInterface />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations')
    })
  })
})
