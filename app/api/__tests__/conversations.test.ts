import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../conversations/route'

// Mock the database connection
vi.mock('@/lib/models', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
  Conversation: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    create: vi.fn().mockImplementation((data) => ({
      _id: 'test-conversation-id',
      title: data.title || 'Test Conversation',
      messageCount: data.messageCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: vi.fn().mockResolvedValue({
        _id: 'test-conversation-id',
        title: data.title || 'Test Conversation',
        messageCount: data.messageCount || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    })),
  },
  Message: {
    create: vi.fn().mockResolvedValue({
      _id: 'test-message-id',
      conversationId: 'test-conversation-id',
      role: 'user',
      content: 'Test message',
      timestamp: new Date(),
    }),
  },
}))

describe('/api/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/conversations', () => {
    it('returns empty array when no conversations exist', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.conversations).toEqual([])
    })

    it('returns conversations sorted by updatedAt descending', async () => {
      // Mock conversations data
      const mockConversations = [
        {
          _id: 'conv-1',
          title: 'First Conversation',
          updatedAt: new Date('2024-01-01T00:00:00Z'),
          messageCount: 5,
        },
        {
          _id: 'conv-2', 
          title: 'Second Conversation',
          updatedAt: new Date('2024-01-02T00:00:00Z'),
          messageCount: 3,
        },
      ]

      const { Conversation } = await import('@/lib/models')
      vi.mocked(Conversation.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockConversations.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )),
          }),
        }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/conversations')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.conversations).toHaveLength(2)
      
      // Should be sorted by updatedAt descending (newest first)
      expect(data.conversations[0].title).toBe('Second Conversation')
      expect(data.conversations[1].title).toBe('First Conversation')
    })

    it('handles database errors', async () => {
      const { connectDB } = await import('@/lib/models')
      vi.mocked(connectDB).mockRejectedValueOnce(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/conversations')
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch conversations')
    })
  })

  describe('POST /api/conversations', () => {
    it('creates a new conversation', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Test Conversation',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.conversation).toMatchObject({
        id: expect.any(String),
        title: 'New Test Conversation',
        messageCount: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('creates conversation with default title when not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.conversation.title).toBe('New conversation')
    })

    it('handles invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create conversation')
    })

    it('handles database creation errors', async () => {
      const { connectDB } = await import('@/lib/models')
      vi.mocked(connectDB).mockRejectedValueOnce(new Error('Database creation failed'))

      const request = new NextRequest('http://localhost:3000/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Conversation',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create conversation')
    })
  })
})
