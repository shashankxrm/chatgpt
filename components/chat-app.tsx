"use client"

import { useState, useCallback, useEffect } from "react"
import { ChatInterface } from "@/components/chat-interface"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export function ChatApp() {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [refreshSidebar, setRefreshSidebar] = useState(0) // Trigger for sidebar refresh

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }, [])

  // Load conversations on component mount and when refreshSidebar changes
  useEffect(() => {
    loadConversations()
  }, [loadConversations, refreshSidebar])

  // Handle new chat
  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null)
  }, [])

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId || null)
  }, [])

  // Handle conversation created (called from chat interface)
  const handleConversationCreated = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId)
    setRefreshSidebar(prev => prev + 1) // Trigger sidebar refresh
  }, [])

  // Function to refresh sidebar (can be called from sidebar)
  const handleRefreshSidebar = useCallback(() => {
    setRefreshSidebar(prev => prev + 1)
  }, [])

  return (
    <div
      className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden"
      role="application"
      aria-label="ChatGPT Interface"
    >
      <Sidebar 
        currentConversationId={currentConversationId}
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRefresh={handleRefreshSidebar}
      />
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <Header />
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface 
            currentConversationId={currentConversationId}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  )
}
