"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { SiOpenai } from "react-icons/si";
import { BsLayoutSidebar } from "react-icons/bs";
import {
  PenSquare,
  MessageSquare,
  Settings,
  User,
  ChevronLeft,
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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SettingsModal } from "@/components/settings/settings-modal"
import { UserButton, useUser, SignInButton } from '@clerk/nextjs'

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
  isMobile?: boolean
}

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export function Sidebar({ currentConversationId, conversations = [], onNewChat, onSelectConversation, onRefresh, isMobile = false }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [isLoading] = useState(false)
  const { isSignedIn, isLoaded, user } = useUser()

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

  // Use real conversations
  const allConversations = chatHistory

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
          "flex flex-col bg-[#f7f7f8] dark:bg-[#171717] border-r border-gray-200 dark:border-gray-700 transition-all duration-300 h-screen",
          isMobile ? "w-72" : isCollapsed ? "w-16" : "w-64 md:max-w-64",
        )}
        role="navigation"
        aria-label="Chat navigation"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between px-3 py-3">
          {isCollapsed ? (
            /* Collapsed State - Only Logo with Hover Effect */
            <Button
              onClick={() => setIsCollapsed(false)}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 group cursor-pointer"
              aria-label="Expand sidebar"
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <SiOpenai className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:hidden" />
                <BsLayoutSidebar className="w-5 h-5 text-gray-600 dark:text-gray-300 hidden group-hover:block" />
              </div>
            </Button>
          ) : (
            /* Expanded State - Logo + Close Button */
            <>
              <div className="flex items-center gap-2 cursor-pointer px-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <SiOpenai className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
              {!isMobile && (
                <Button
                  onClick={() => setIsCollapsed(true)}
                  variant="ghost"
                  size="sm"
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  aria-label="Collapse sidebar"
                >
                  <BsLayoutSidebar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Navigation Group */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 space-y-1 mb-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
              onClick={handleNewChat}
              aria-label="Start new chat"
            >
              <PenSquare className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left">New chat</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <Search className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left">Search chats</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left">Library</span>
            </Button>
          </div>
        )}

        {/* Tools Group */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 space-y-1 mb-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left">Sora</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left">GPTs</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-normal hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="flex-1 text-left truncate">CV & Resume - Evaluator (AT...</span>
            </Button>
          </div>
        )}

        {/* Projects Group */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 py-2 mb-4">
            <div className="flex items-center gap-2 px-3 py-2">
              <FolderOpen className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Projects</span>
              <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-1.5 py-0.5 rounded">
                NEW
              </span>
            </div>
          </div>
        )}

        {/* Chats Group */}
        {(!isCollapsed || isMobile) && (
          <div className="px-3 py-2 mb-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1">Chats</h3>
          </div>
        )}

        {!isCollapsed && (
          <ScrollArea className="flex-1 px-3 h-0" aria-label="Chat history">
            <div className="space-y-1 pb-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading conversations...</div>
                </div>
              ) : allConversations.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</div>
                </div>
              ) : (
                allConversations.map((chat) => (
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
                        <Button size="sm" variant="ghost" onClick={saveEditChat} className="h-8 w-8 p-0 cursor-pointer">
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEditChat} className="h-8 w-8 p-0 cursor-pointer">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className={cn(
                        "flex items-center group/chat hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors",
                        currentConversationId === chat.id && "bg-gray-100 dark:bg-gray-800"
                      )}>
                        <Button
                          variant="ghost"
                          className="flex-1 justify-start text-left h-auto px-3 py-2.5 transition-colors cursor-pointer rounded-md hover:bg-transparent"
                          onClick={() => handleSelectConversation(chat.id)}
                          aria-label={`Open chat: ${chat.title}`}
                        >
                          <div className="flex items-center gap-3 w-full min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-normal truncate text-pretty text-gray-700 dark:text-gray-200">{chat.title}</div>
                              {/* <div className="text-xs text-gray-500 dark:text-gray-400">{chat.timestamp}</div> */}
                            </div>
                          </div>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover/chat:opacity-100 transition-opacity cursor-pointer hover:bg-transparent rounded"
                              aria-label="Chat options"
                            >
                              <MoreHorizontal className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#2f2f2f] border-gray-200 dark:border-gray-600">
                            <DropdownMenuItem 
                              onClick={() => startEditingChat(chat)}
                              className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteChat(chat.id)}
                              className="text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
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

        {/* Profile Section */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed ? (
            /* Expanded Profile Section */
            <div className="space-y-1">
              
              
              {/* User Profile */}
              <div className="flex items-center gap-3 px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
                {!isLoaded ? (
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                ) : isSignedIn ? (
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-6 h-6",
                        userButtonPopoverCard: "shadow-lg",
                      }
                    }}
                  />
                ) : (
                  <SignInButton mode="modal">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 px-0 py-0 h-auto text-sm font-normal hover:bg-transparent text-gray-700 dark:text-gray-200"
                    >
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        S
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-gray-100">Sign In</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Get started</div>
                      </div>
                    </Button>
                  </SignInButton>
                )}
                
                {isSignedIn && user && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {user.firstName || user.emailAddresses[0]?.emailAddress || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Free</div>
                  </div>
                )}
                
                {isSignedIn && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-auto bg-transparent border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Profile Section */
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSettings(true)} 
                aria-label="Open settings"
                className="w-full h-10 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </Button>
              
              {!isLoaded ? (
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse mx-auto" />
              ) : isSignedIn ? (
                <div className="flex justify-center">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                        userButtonPopoverCard: "shadow-lg",
                      }
                    }}
                  />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Sign in"
                  >
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                      S
                    </div>
                  </Button>
                </SignInButton>
              )}
            </div>
          )}
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
