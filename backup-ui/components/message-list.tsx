"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Share, Edit3, Check, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  cloudinaryId?: string
}

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  attachments?: AttachedFile[]
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
                      <div className="text-sm sm:text-base leading-relaxed text-balance break-words prose prose-sm max-w-none dark:prose-invert">
                        {message.role === "assistant" ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              // Custom styling for better readability
                              h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="ml-2">{children}</li>,
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                ) : (
                                  <code className={className}>{children}</code>
                                );
                              },
                              pre: ({ children }) => (
                                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-2 text-xs">
                                  {children}
                                </pre>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
                                  {children}
                                </blockquote>
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto mb-2">
                                  <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 bg-gray-50 dark:bg-gray-700 font-semibold text-left">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                  {children}
                                </td>
                              ),
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
                        {message.isEdited && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            (edited)
                          </div>
                        )}
                      </div>
                      
                      {/* File Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            Attachments ({message.attachments.length})
                          </div>
                          <div className="grid gap-2">
                            {message.attachments.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div className="flex-shrink-0">
                                  {file.type.startsWith('image/') ? (
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  ) : file.type === 'application/pdf' ? (
                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  ) : file.type.includes('word') || file.type.includes('document') ? (
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {file.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {file.type} • {(file.size / 1024).toFixed(1)} KB
                                  </div>
                                </div>
                                <div className="flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => window.open(file.url, '_blank')}
                                    aria-label={`Open ${file.name}`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
