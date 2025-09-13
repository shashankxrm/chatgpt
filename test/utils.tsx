import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock providers for testing
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  }
  
  ;(global.fetch as any).mockResolvedValue(mockResponse)
  return mockResponse
}

export const mockApiError = (message: string, status = 500) => {
  const mockResponse = {
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ error: message }),
    text: vi.fn().mockResolvedValue(JSON.stringify({ error: message })),
  }
  
  ;(global.fetch as any).mockResolvedValue(mockResponse)
  return mockResponse
}

// Test data factories
export const createMockMessage = (overrides: Partial<any> = {}) => ({
  id: 'test-message-id',
  content: 'Test message content',
  role: 'user' as const,
  timestamp: new Date('2024-01-01T00:00:00Z'),
  attachments: [],
  model: 'gpt-4',
  isEdited: false,
  editedAt: undefined,
  ...overrides,
})

export const createMockConversation = (overrides: Partial<any> = {}) => ({
  id: 'test-conversation-id',
  title: 'Test Conversation',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  messageCount: 5,
  ...overrides,
})

export const createMockAttachedFile = (overrides: Partial<any> = {}) => ({
  id: 'test-file-id',
  name: 'test-file.pdf',
  size: 1024,
  type: 'application/pdf',
  url: 'https://example.com/test-file.pdf',
  cloudinaryId: 'test-cloudinary-id',
  isUploading: false,
  ...overrides,
})

// Utility functions
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
