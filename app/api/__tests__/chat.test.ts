import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../chat/route'

// Mock the AI service
vi.mock('@/lib/ai/vercel-ai', () => ({
  generateChatResponse: vi.fn().mockResolvedValue({
    id: 'test-ai-response-id',
    content: 'This is a test AI response',
    model: 'gpt-4',
    usage: {
      totalTokens: 150,
      promptTokens: 50,
      completionTokens: 100,
    },
  }),
}))

// Mock the database models
vi.mock('@/lib/models', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
  Conversation: {
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(() => ({
      _id: 'test-conversation-id',
      title: 'New Conversation',
      messageCount: 0,
      lastMessageAt: new Date(),
      save: vi.fn().mockResolvedValue({
        _id: 'test-conversation-id',
        title: 'New Conversation',
        messageCount: 0,
        lastMessageAt: new Date(),
      }),
    })),
  },
  Message: {
    create: vi.fn().mockImplementation(() => ({
      _id: 'test-message-id',
      conversationId: 'test-conversation-id',
      role: 'assistant',
      content: 'This is a test AI response',
      timestamp: new Date(),
      save: vi.fn().mockResolvedValue({
        _id: 'test-message-id',
        conversationId: 'test-conversation-id',
        role: 'assistant',
        content: 'This is a test AI response',
        timestamp: new Date(),
      }),
    })),
  },
}))

// Mock the models/index file
vi.mock('@/lib/models/index', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
  Conversation: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue({
      _id: 'test-conversation-id',
      title: 'New Conversation',
      messageCount: 0,
      lastMessageAt: new Date(),
    }),
  })),
  Message: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue({
      _id: 'test-message-id',
      conversationId: 'test-conversation-id',
      role: 'assistant',
      content: 'This is a test AI response',
      timestamp: new Date(),
    }),
  })),
}))

// Mock context manager
vi.mock('@/lib/context-manager', () => ({
  getConversationContext: vi.fn().mockResolvedValue({
    messages: [
      { role: 'user', content: 'Test message' },
    ],
    tokensUsed: 50,
    messagesTrimmed: 0,
  }),
}))

describe('/api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('creates a new conversation when no conversationId provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, AI!',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversation_id).toBe('test-conversation-id')
    expect(data.content).toBe('This is a test AI response')
    expect(data.role).toBe('assistant')
  })

  it('uses existing conversation when conversationId provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, AI!',
        conversationId: 'existing-conversation-id',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.conversation_id).toBe('existing-conversation-id')
    expect(data.content).toBe('This is a test AI response')
  })

  it('handles missing message', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Message is required')
  })

  it('handles invalid JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: 'invalid json',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat message')
  })

  it('handles AI service errors', async () => {
    const { generateChatResponse } = await import('@/lib/ai/vercel-ai')
    vi.mocked(generateChatResponse).mockRejectedValueOnce(new Error('AI service error'))

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, AI!',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat message')
  })

  it('handles database connection errors', async () => {
    const { connectDB } = await import('@/lib/models')
    vi.mocked(connectDB).mockRejectedValueOnce(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, AI!',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to process chat message')
  })

  it('includes usage information in response', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, AI!',
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.usage).toEqual({
      totalTokens: 150,
      promptTokens: 50,
      completionTokens: 100,
    })
  })

  it('handles attachments in message', async () => {
    const attachments = [
      {
        id: 'file-1',
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        url: 'https://example.com/test.pdf',
      },
    ]

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Please analyze this file',
        attachments,
        stream: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.content).toBe('This is a test AI response')
  })
})
