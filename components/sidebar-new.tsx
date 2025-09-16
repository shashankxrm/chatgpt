"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  PenSquare,
  MessageSquare,
  Settings,
  User,
  MoreHorizontal,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  BookOpen,
  Sparkles,
  Bot,
  FileText,
  FolderOpen,
  PanelLeftClose,
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
  isOpen: boolean
  onToggle: () => void
  isMobile?: boolean
}

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

const navigationItems = [
  { icon: PenSquare, label: "New chat", shortcut: "⌘N" },
  { icon: Search, label: "Search chats" },
  { icon: BookOpen, label: "Library" },
]

const toolItems = [
  { icon: Sparkles, label: "Sora" },
  { icon: Bot, label: "GPTs" },
  { icon: FileText, label: "CV & Resume - Evaluator (AT..." },
]

export function Sidebar({ isOpen, onToggle, isMobile }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Load conversations from API
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/conversations')
      const data = await response.json()
      
      if (data.success) {
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load conversations on component mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

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
    setCurrentConversationId(null)
    // Close sidebar on mobile after new chat
    if (isMobile) {
      onToggle()
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId || null)
    // Close sidebar on mobile after selection
    if (isMobile) {
      onToggle()
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

        if (response.ok) {
          loadConversations() // Refresh the sidebar
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
        if (currentConversationId === chatId) {
          setCurrentConversationId(null)
        }
        
        // Refresh the sidebar
        loadConversations()
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col bg-[#f7f7f8] dark:bg-[#171717] border-r border-gray-200 dark:border-gray-700 transition-all duration-200 h-full",
          isOpen ? "w-64" : "w-0 overflow-hidden",
          isMobile && isOpen && "fixed left-0 top-0 h-full z-50",
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black dark:bg-white rounded-sm flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white dark:fill-black">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
              </svg>
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">ChatGPT</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <PanelLeftClose className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>

        <div className="p-2 space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start gap-3 px-2 py-1.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
              onClick={item.label === "New chat" ? handleNewChat : undefined}
            >
              <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && <span className="text-xs text-gray-500 dark:text-gray-400">{item.shortcut}</span>}
            </Button>
          ))}
        </div>

        <div className="px-2 space-y-1">
          {toolItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start gap-3 px-2 py-1.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            >
              <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left truncate">{item.label}</span>
            </Button>
          ))}
        </div>

        <div className="px-2 py-1">
          <div className="flex items-center gap-2 px-2 py-1">
            <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Projects</span>
            <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-1.5 py-0.5 rounded">
              NEW
            </span>
          </div>
        </div>

        <div className="px-2 py-1">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">Chats</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="space-y-1 pb-4">
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
                          "flex-1 justify-start text-left h-auto px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors",
                          currentConversationId === chat.id && "bg-gray-200 dark:bg-gray-700"
                        )}
                        onClick={() => handleSelectConversation(chat.id)}
                        aria-label={`Open chat: ${chat.title}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-pretty">{chat.title}</div>
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
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              S
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900 dark:text-gray-100">Shashank RM</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Free</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-auto bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Upgrade
            </Button>
          </Button>
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
