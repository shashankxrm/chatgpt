"use client"

import { useState, useCallback } from "react"
import { MessageList } from "@/components/message-list"
import { ChatInput } from "@/components/chat-input"

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
}

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  attachments?: AttachedFile[]
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = useCallback(async (content: string, attachments?: AttachedFile[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
      attachments,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call the real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          attachments: attachments || [],
          stream: false
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: data.id || Date.now().toString(),
        content: data.content,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat API error:', error)
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I encountered an error while processing your message. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    setMessages((prev) => {
      const messageIndex = prev.findIndex((m) => m.id === messageId)
      if (messageIndex === -1) return prev

      // Update the message and remove all subsequent messages
      const updatedMessages = prev.slice(0, messageIndex + 1)
      updatedMessages[messageIndex] = {
        ...updatedMessages[messageIndex],
        content: newContent,
        timestamp: new Date(),
      }

      return updatedMessages
    })

    // Regenerate response after editing user message
    if (newContent.trim()) {
      setIsLoading(true)
      setTimeout(() => {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content:
            "This is a regenerated response based on your edited message. In a real implementation, this would be a new AI response.",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1500)
    }
  }, [])

  const handleRegenerateResponse = useCallback(
    (messageId: string) => {
      const messageIndex = messages.findIndex((m) => m.id === messageId)
      if (messageIndex === -1) return

      // Remove the message and all subsequent messages
      setMessages((prev) => prev.slice(0, messageIndex))

      setIsLoading(true)
      setTimeout(() => {
        const responses = [
          "Here's a regenerated response with different content. This simulates how ChatGPT can provide alternative answers to the same question.",
          "This is an alternative response to your previous message. In the real ChatGPT, this would be a completely new AI-generated answer.",
          "Regenerated! This demonstrates how you can get different perspectives on the same topic by regenerating responses.",
        ]

        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: responses[Math.floor(Math.random() * responses.length)],
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      }, 1500)
    },
    [messages],
  )

  const handleExampleClick = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt)
    },
    [handleSendMessage],
  )

  return (
    <div className="flex flex-col h-full relative" role="main" aria-label="Chat interface">
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center px-4 py-8 min-h-full">
            <div className="text-center max-w-2xl w-full">
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 text-balance">
                ChatGPT
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div
                  className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => handleExampleClick("Explain quantum computing in simple terms")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleExampleClick("Explain quantum computing in simple terms")
                    }
                  }}
                  aria-label="Example prompt: Explain quantum computing in simple terms"
                >
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Examples</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    &quot;Explain quantum computing in simple terms&quot;
                  </p>
                </div>
                <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Capabilities</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Remembers what user said earlier in the conversation
                  </p>
                </div>
                <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Limitations</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    May occasionally generate incorrect information
                  </p>
                </div>
                <div
                  className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => handleExampleClick("Write a Python script for data analysis")}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      handleExampleClick("Write a Python script for data analysis")
                    }
                  }}
                  aria-label="Example prompt: Write a Python script for data analysis"
                >
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Use Cases</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    &quot;Write a Python script for data analysis&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onEditMessage={handleEditMessage}
            onRegenerateResponse={handleRegenerateResponse}
          />
        </div>
      )}

      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="p-3 sm:p-4">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
        <div className="text-center pb-3 sm:pb-4 px-3 sm:px-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By messaging ChatGPT, you agree to our{" "}
            <a
              href="#"
              className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Terms
            </a>{" "}
            and have read our{" "}
            <a
              href="#"
              className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
