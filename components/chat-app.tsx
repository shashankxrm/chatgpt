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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile sidebar state

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
    // Close sidebar on mobile after new chat
    setIsSidebarOpen(false)
  }, [])

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId || null)
    // Close sidebar on mobile after selection
    setIsSidebarOpen(false)
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
      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden md:block">
        <Sidebar 
          currentConversationId={currentConversationId}
          conversations={conversations}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onRefresh={handleRefreshSidebar}
        />
      </div>

      {/* Mobile Sidebar - Overlay when open */}
      {isSidebarOpen && (
        <>
          {/* Backdrop with blur effect */}
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 md:hidden mobile-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Mobile Sidebar */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 md:hidden mobile-sidebar">
            <Sidebar 
              currentConversationId={currentConversationId}
              conversations={conversations}
              onNewChat={handleNewChat}
              onSelectConversation={handleSelectConversation}
              onRefresh={handleRefreshSidebar}
              isMobile={true}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
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
