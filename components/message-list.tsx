"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Share, Edit3, Check, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isEditing?: boolean
  isEdited?: boolean
  editedAt?: Date
  model?: string
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  onEditMessage?: (messageId: string, newContent: string) => void
  onRegenerateResponse?: (messageId: string) => void
  onDeleteMessage?: (messageId: string) => void
}

export function MessageList({ messages, isLoading, onEditMessage, onRegenerateResponse, onDeleteMessage }: MessageListProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    }
  }, [messages, isLoading])


  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const saveEdit = () => {
    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, editContent)
      setEditingMessageId(null)
      setEditContent("")
    }
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleDeleteMessage = (messageId: string) => {
    if (onDeleteMessage) {
      onDeleteMessage(messageId)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }

  return (
    <div className="h-full flex flex-col" role="main" aria-label="Chat messages">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-4 px-2 sm:px-4 space-y-4 sm:space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="group" role="article" aria-label={`${message.role} message`}>
              <div className={cn("flex gap-2 sm:gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
                {message.role === "assistant" && (
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1" aria-label="ChatGPT">
                    <AvatarImage src="/chatgpt-logo-inspired.png" alt="ChatGPT" />
                    <AvatarFallback className="bg-green-500 text-white text-xs sm:text-sm">AI</AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "flex-1 space-y-2 min-w-0",
                    message.role === "user" ? "max-w-[85%] sm:max-w-xs" : "max-w-none",
                  )}
                >
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="min-h-[80px] resize-none text-sm sm:text-base"
                        aria-label="Edit message"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} aria-label="Save edit (Cmd+Enter)" className="h-8">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          aria-label="Cancel edit (Escape)"
                          className="h-8 bg-transparent"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 sm:px-4 sm:py-3 transition-all duration-200",
                        message.role === "user"
                          ? "bg-gray-100 dark:bg-gray-700 ml-auto text-gray-900 dark:text-gray-100"
                          : "bg-transparent border-none p-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-none",
                      )}
                    >
                      <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-balance break-words">
                        {message.content}
                        {message.isEdited && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            (edited)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {editingMessageId !== message.id && (
                    <div className="flex items-center gap-0.5 sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {message.role === "assistant" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => copyToClipboard(message.content)}
                            aria-label="Copy message"
                          >
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Like message"
                          >
                            <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Dislike message"
                          >
                            <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => onRegenerateResponse?.(message.id)}
                            aria-label="Regenerate response"
                          >
                            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            aria-label="Share message"
                          >
                            <Share className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </>
                      )}
                      {message.role === "user" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => startEditing(message)}
                            aria-label="Edit message"
                          >
                            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                            onClick={() => handleDeleteMessage(message.id)}
                            aria-label="Delete message"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1" aria-label="User">
                    <AvatarImage src="/diverse-user-avatars.png" alt="User" />
                    <AvatarFallback className="bg-blue-500 text-white text-xs sm:text-sm">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 sm:gap-4" role="status" aria-label="ChatGPT is typing">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 mt-1">
                <AvatarImage src="/chatgpt-logo-inspired.png" alt="ChatGPT" />
                <AvatarFallback className="bg-green-500 text-white text-xs sm:text-sm">AI</AvatarFallback>
              </Avatar>
              <div className="flex-1 pt-2">
                <div className="flex items-center space-x-1" aria-hidden="true">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="sr-only">ChatGPT is generating a response</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
