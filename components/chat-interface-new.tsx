"use client"

import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "./sidebar-new"
import { MainContent } from "./main-content-new"
import { Header } from "./header-new"

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [refreshSidebar, setRefreshSidebar] = useState(0) // Trigger for sidebar refresh

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false) // Collapsed by default on mobile
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId || null)
    // Close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  // Handle conversation created (called from main content)
  const handleConversationCreated = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId)
    setRefreshSidebar(prev => prev + 1) // Trigger sidebar refresh
  }, [])

  // Function to refresh sidebar (can be called from sidebar)
  const handleRefreshSidebar = useCallback(() => {
    setRefreshSidebar(prev => prev + 1)
  }, [])

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121] text-black dark:text-white relative overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        isMobile={isMobile}
        currentConversationId={currentConversationId}
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRefresh={handleRefreshSidebar}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <MainContent 
          currentConversationId={currentConversationId}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  )
}
