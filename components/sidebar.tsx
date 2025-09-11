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
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    { id: "1", title: "React best practices", timestamp: "2 hours ago" },
    { id: "2", title: "TypeScript interfaces", timestamp: "1 day ago" },
    { id: "3", title: "Next.js routing", timestamp: "2 days ago" },
    { id: "4", title: "Tailwind CSS tips", timestamp: "3 days ago" },
  ])

  const handleNewChat = () => {
    console.log("Starting new chat...")
    // Placeholder for new chat functionality
  }

  const startEditingChat = (chat: ChatHistory) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const saveEditChat = () => {
    if (editingChatId) {
      setChatHistory((prev) => prev.map((chat) => (chat.id === editingChatId ? { ...chat, title: editTitle } : chat)))
      setEditingChatId(null)
      setEditTitle("")
    }
  }

  const cancelEditChat = () => {
    setEditingChatId(null)
    setEditTitle("")
  }

  const deleteChat = (chatId: string) => {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId))
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
              {chatHistory.map((chat) => (
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
                        className="flex-1 justify-start text-left h-auto p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
              ))}
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
