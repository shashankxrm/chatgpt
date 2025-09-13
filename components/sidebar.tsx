"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  PenSquare,
  MessageSquare,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit3,
  Trash2,
  Check,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SettingsModal } from "@/components/settings/settings-modal"

interface ChatHistory {
  id: string
  title: string
  timestamp: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

interface SidebarProps {
  currentConversationId?: string | null
  conversations?: Conversation[]
  onNewChat?: () => void
  onSelectConversation?: (conversationId: string) => void
  onRefresh?: () => void
}

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export function Sidebar({ currentConversationId, conversations = [], onNewChat, onSelectConversation, onRefresh }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isLoading] = useState(false)

  // Format timestamp for display
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString()
  }

  // Convert conversations to chat history format
  const chatHistory: ChatHistory[] = conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    timestamp: formatTimestamp(conv.updatedAt),
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
    messageCount: conv.messageCount
  }))

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat()
    }
    // Clear current conversation selection
    if (onSelectConversation) {
      onSelectConversation('')
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    if (onSelectConversation) {
      onSelectConversation(conversationId)
    }
  }

  const startEditingChat = (chat: ChatHistory) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const saveEditChat = async () => {
    if (editingChatId) {
      try {
        const response = await fetch(`/api/conversations/${editingChatId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: editTitle }),
        })

        if (response.ok && onRefresh) {
          onRefresh() // Refresh the sidebar
        }
      } catch (error) {
        console.error('Error updating conversation title:', error)
      } finally {
        setEditingChatId(null)
        setEditTitle("")
      }
    }
  }

  const cancelEditChat = () => {
    setEditingChatId(null)
    setEditTitle("")
  }

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/conversations/${chatId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // If this was the current conversation, clear it
        if (currentConversationId === chatId && onSelectConversation) {
          onSelectConversation('')
        }
        
        // Refresh the sidebar
        if (onRefresh) {
          onRefresh()
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-screen",
          isCollapsed ? "w-16" : "w-64 md:w-80",
        )}
        role="navigation"
        aria-label="Chat navigation"
      >
        <div className="p-3">
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="icon"
            className="mb-3"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {!isCollapsed && (
            <Button
              className="w-full justify-start gap-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 transition-colors"
              onClick={handleNewChat}
              aria-label="Start new chat"
            >
              <PenSquare className="h-4 w-4" />
              New chat
            </Button>
          )}
        </div>

        {!isCollapsed && (
          <ScrollArea className="flex-1 px-3" aria-label="Chat history">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-2">Recent</div>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading conversations...</div>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</div>
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <div key={chat.id} className="group relative">
                    {editingChatId === chat.id ? (
                      <div className="flex items-center gap-2 p-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditChat()
                            if (e.key === "Escape") cancelEditChat()
                          }}
                          aria-label="Edit chat title"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={saveEditChat} className="h-8 w-8 p-0">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditChat} className="h-8 w-8 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          className={cn(
                            "flex-1 justify-start text-left h-auto p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                            currentConversationId === chat.id && "bg-gray-200 dark:bg-gray-700"
                          )}
                          onClick={() => handleSelectConversation(chat.id)}
                          aria-label={`Open chat: ${chat.title}`}
                        >
                          <div className="flex items-center gap-2 w-full min-w-0">
                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate text-pretty">{chat.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{chat.timestamp}</div>
                            </div>
                          </div>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Chat options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => startEditingChat(chat)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteChat(chat.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed ? (
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 transition-colors"
                onClick={() => setShowSettings(true)}
                aria-label="Open settings"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 transition-colors"
                aria-label="View profile"
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} aria-label="Open settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="View profile">
                <User className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
