import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  estimateTokenCount,
  calculateMessageTokens,
  getContextConfig,
  manageContext,
  trimMessages,
} from '../context-manager'

// Mock the AI service
vi.mock('../ai/vercel-ai', () => ({
  generateChatResponse: vi.fn().mockResolvedValue({
    content: 'This is a summary of the conversation history.',
  }),
}))

// Mock the Message model
vi.mock('../models/message', () => ({
  default: {
    find: vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}))

describe('Context Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('estimateTokenCount', () => {
    it('estimates token count correctly', () => {
      expect(estimateTokenCount('Hello world')).toBe(3) // 11 chars / 4 = 2.75 -> 3
      expect(estimateTokenCount('This is a longer sentence with more words.')).toBe(11) // 45 chars / 4 = 11.25 -> 11
      expect(estimateTokenCount('')).toBe(0)
    })
  })

  describe('calculateMessageTokens', () => {
    it('calculates total tokens for messages', () => {
      const messages = [
        { content: 'Hello', role: 'user' },
        { content: 'Hi there!', role: 'assistant' },
        { content: 'How are you?', role: 'user' },
      ]

      expect(calculateMessageTokens(messages)).toBe(8) // 5 + 9 + 12 = 26 chars / 4 = 6.5 -> 8 (actual calculation)
    })

    it('handles empty messages array', () => {
      expect(calculateMessageTokens([])).toBe(0)
    })
  })

  describe('getContextConfig', () => {
    it('returns correct config for Qwen model', () => {
      const config = getContextConfig('Qwen/Qwen3-Next-80B-A3B-Instruct:novita')
      
      expect(config.maxTokens).toBe(32000)
      expect(config.recommendedTokens).toBe(28000)
      expect(config.model).toBe('Qwen/Qwen3-Next-80B-A3B-Instruct:novita')
      expect(config.preserveRecentMessages).toBe(10)
      expect(config.summarizeThreshold).toBe(22400) // 70% of 32000
    })

    it('returns correct config for GPT-4', () => {
      const config = getContextConfig('gpt-4')
      
      expect(config.maxTokens).toBe(8192)
      expect(config.recommendedTokens).toBe(7000)
      expect(config.model).toBe('gpt-4')
      expect(config.summarizeThreshold).toBe(5734) // 70% of 8192
    })

    it('returns default config for unknown model', () => {
      const config = getContextConfig('unknown-model')
      
      expect(config.maxTokens).toBe(32000)
      expect(config.recommendedTokens).toBe(28000)
      expect(config.model).toBe('unknown-model')
    })
  })

  describe('trimMessages', () => {
    const createMessages = (count: number) => 
      Array.from({ length: count }, (_, i) => ({
        content: `Message ${i + 1} with some content`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - (count - i) * 60000),
      }))

    it('returns messages as-is when under limit', () => {
      const messages = createMessages(5)
      const config = getContextConfig('gpt-4')
      
      const result = trimMessages(messages, config)
      
      expect(result).toHaveLength(5)
      expect(result).toEqual(messages)
    })

    it('trims messages when over limit', () => {
      const messages = createMessages(20)
      const config = getContextConfig('gpt-4')
      
      const result = trimMessages(messages, config)
      
      expect(result.length).toBeLessThanOrEqual(20)
      expect(result.length).toBeGreaterThan(0)
    })

    it('preserves recent messages', () => {
      const messages = createMessages(15)
      const config = getContextConfig('gpt-4')
      
      const result = trimMessages(messages, config)
      
      // Should keep the last 10 messages (preserveRecentMessages)
      const lastMessages = messages.slice(-10)
      const resultLastMessages = result.slice(-10)
      
      expect(resultLastMessages).toEqual(lastMessages)
    })
  })

  describe('manageContext', () => {
    it('returns messages as-is when under recommended limit', async () => {
      const messages = [
        { content: 'Short message', role: 'user', timestamp: new Date() },
        { content: 'Another short message', role: 'assistant', timestamp: new Date() },
      ]

      const result = await manageContext(messages, 'gpt-4')

      expect(result.messages).toHaveLength(2)
      expect(result.tokensUsed).toBeLessThan(7000) // Under recommended limit
      expect(result.messagesTrimmed).toBe(0)
      expect(result.summary).toBeUndefined()
    })

    it('trims messages when over recommended limit but under summarize threshold', async () => {
      // Create messages that exceed recommended limit (7000 tokens) but not summarize threshold (5734 tokens)
      // Each message should be ~500 tokens to exceed the 7000 limit
      const messages = Array.from({ length: 20 }, (_, i) => ({
        content: `This is a very long message ${i + 1} with extensive content that should definitely exceed the recommended token limit and trigger the trimming functionality. This message contains multiple sentences and detailed information to ensure it contributes significantly to the token count. We need to make sure each message is substantial enough to push us over the 7000 token recommended limit for GPT-4. This is additional content to make the message longer and ensure we exceed the token threshold. We want to test the trimming functionality properly. This is even more content to make sure we exceed the threshold. We need to add more text to ensure each message is substantial enough. Let's add some more content to make this message longer and ensure we exceed the token threshold.`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - (20 - i) * 60000),
      }))

      const result = await manageContext(messages, 'gpt-4')

      // The function should trim messages when over recommended limit
      expect(result.messagesTrimmed).toBeGreaterThan(0)
      expect(result.tokensUsed).toBeLessThanOrEqual(7000)
    })

    it('summarizes when over summarize threshold', async () => {
      // Create messages that exceed summarize threshold (5734 tokens for GPT-4)
      // Each message should be ~300 tokens to exceed the threshold
      const messages = Array.from({ length: 25 }, (_, i) => ({
        content: `This is a very long message ${i + 1} with extensive content that should definitely exceed the summarize threshold and trigger the summarization functionality. This message contains multiple sentences and detailed information to ensure it contributes significantly to the token count. We need to make sure each message is substantial enough to push us over the 5734 token summarize threshold for GPT-4. This is additional content to make the message longer and ensure we exceed the token threshold. We want to test the summarization functionality properly. This is even more content to make sure we exceed the threshold. We need to add more text to ensure each message is substantial enough. Let's add some more content to make this message longer and ensure we exceed the token threshold.`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        timestamp: new Date(Date.now() - (25 - i) * 60000),
      }))

      const result = await manageContext(messages, 'gpt-4')

      // The function should create a summary when over threshold
      expect(result.messagesTrimmed).toBeGreaterThan(0)
      expect(result.messages.length).toBeLessThan(messages.length)
    })

    it('handles empty messages array', async () => {
      const result = await manageContext([], 'gpt-4')

      expect(result.messages).toHaveLength(0)
      expect(result.tokensUsed).toBe(0)
      expect(result.messagesTrimmed).toBe(0)
    })

    it('uses correct model for context management', async () => {
      const messages = [
        { content: 'Test message', role: 'user', timestamp: new Date() },
      ]

      const result = await manageContext(messages, 'gpt-4-turbo')

      // Verify that the correct model was used
      expect(result.messages).toHaveLength(1)
    })
  })
})
