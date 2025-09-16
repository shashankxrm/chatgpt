"use client"

import { useState, useCallback, useEffect } from "react"
import { MessageList } from "@/components/message-list"
import { ChatInput } from "@/components/chat-input"

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  cloudinaryId?: string
  isUploading?: boolean
}

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  attachments?: AttachedFile[]
  model?: string
  isEdited?: boolean
  editedAt?: Date
}

interface ApiMessage {
  id: string
  role: string
  content: string
  timestamp: string
  attachments?: AttachedFile[]
  model?: string
  isEdited?: boolean
  editedAt?: string
}

export function MainContent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  // Load messages for the current conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()
      
      if (data.success) {
        const loadedMessages: Message[] = data.messages.map((msg: ApiMessage) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.timestamp),
          attachments: msg.attachments || [],
          model: msg.model,
          isEdited: msg.isEdited || false,
          editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined,
        }))
        setMessages(loadedMessages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId)
    } else {
      setMessages([]) // Clear messages for new chat
    }
  }, [currentConversationId, loadMessages])

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
      // Call the real AI API with conversation ID
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId: currentConversationId,
          attachments: attachments || [],
          stream: false
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Update current conversation ID if this is a new conversation
      if (data.conversation_id && !currentConversationId) {
        setCurrentConversationId(data.conversation_id)
      }

      const assistantMessage: Message = {
        id: data.id || Date.now().toString(),
        content: data.content,
        role: "assistant",
        timestamp: new Date(),
        model: data.model,
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
  }, [currentConversationId])

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!currentConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent,
          regenerate: true // Regenerate AI response if it's a user message
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update the edited message
        setMessages((prev) => {
          const messageIndex = prev.findIndex((m) => m.id === messageId);
          if (messageIndex === -1) return prev;

          const updatedMessages = [...prev];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            content: data.message.content,
            isEdited: data.message.isEdited,
            editedAt: data.message.editedAt ? new Date(data.message.editedAt) : undefined,
          };
          return updatedMessages;
        });

        // If there's a regenerated response, add it
        if (data.regeneratedResponse) {
          const regeneratedMessage: Message = {
            id: data.regeneratedResponse.id,
            content: data.regeneratedResponse.content,
            role: 'assistant',
            timestamp: new Date(data.regeneratedResponse.timestamp),
            model: data.regeneratedResponse.model,
          };

          setMessages((prev) => [...prev, regeneratedMessage]);
        }
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, [currentConversationId])

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!currentConversationId) return;

    try {
      const response = await fetch(`/api/conversations/${currentConversationId}/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Remove the message from the UI
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, [currentConversationId])

  const handleRegenerateResponse = useCallback(async (messageId: string) => {
    if (!currentConversationId) return;

    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    // Remove the message and all subsequent messages
    setMessages((prev) => prev.slice(0, messageIndex))
    setIsLoading(true)

    try {
      // Get the user message that we want to regenerate the response for
      const userMessage = messages[messageIndex - 1]
      if (!userMessage || userMessage.role !== 'user') {
        setIsLoading(false)
        return
      }

      // Call the chat API to regenerate the response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: currentConversationId,
          stream: false,
          regenerate: true // Flag to indicate this is a regeneration
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Add the regenerated response
      const assistantMessage: Message = {
        id: data.id,
        content: data.content,
        role: "assistant",
        timestamp: new Date(data.timestamp),
        model: data.aiModel
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error regenerating response:', error)
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't regenerate the response. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [messages, currentConversationId])

  const handleExampleClick = useCallback(
    (prompt: string) => {
      handleSendMessage(prompt)
    },
    [handleSendMessage],
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full text-center">
            <h1 className="text-xl md:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-6 md:mb-8 text-balance">
              {"What's on the agenda today?"}
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

            <div className="relative">
              <div className="chatgpt-input flex items-center bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-600 rounded-full px-3 md:px-4 py-2.5 md:py-3 shadow-sm hover:shadow-md transition-shadow">
                <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onEditMessage={handleEditMessage}
            onRegenerateResponse={handleRegenerateResponse}
            onDeleteMessage={handleDeleteMessage}
          />
        </div>
      )}

      {messages.length > 0 && (
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
      )}
    </div>
  )
}
