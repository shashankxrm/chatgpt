import mongoose from 'mongoose'
import { beforeAll, afterAll, beforeEach } from 'vitest'

const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatgpt-test'

export const setupTestDatabase = () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_DB_URI)
    console.log('✅ Connected to test database')
  })

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.db?.dropDatabase()
    await mongoose.connection.close()
    console.log('✅ Test database cleaned up')
  })

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections
    for (const key in collections) {
      const collection = collections[key]
      await collection.deleteMany({})
    }
  })
}

export const createTestConversation = async (overrides: any = {}) => {
  const Conversation = mongoose.model('Conversation')
  return await Conversation.create({
    title: 'Test Conversation',
    messageCount: 0,
    lastMessageAt: new Date(),
    ...overrides,
  })
}

export const createTestMessage = async (conversationId: string, overrides: any = {}) => {
  const Message = mongoose.model('Message')
  return await Message.create({
    conversationId,
    role: 'user',
    content: 'Test message',
    timestamp: new Date(),
    ...overrides,
  })
}

export const createTestMemory = async (conversationId: string, overrides: any = {}) => {
  const Memory = mongoose.model('Memory')
  return await Memory.create({
    conversationId,
    summary: 'Test conversation summary',
    keyPoints: [
      {
        key: 'test-key',
        value: 'test-value',
        importance: 5,
        createdAt: new Date(),
      },
    ],
    totalTokens: 100,
    lastUpdated: new Date(),
    version: 1,
    ...overrides,
  })
}
