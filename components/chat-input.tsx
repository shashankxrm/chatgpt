"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Search, Mic, Send, Square, X, FileText, ImageIcon, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
}

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: AttachedFile[]) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim() || attachedFiles.length > 0) && !disabled) {
      onSendMessage(message.trim(), attachedFiles)
      setMessage("")
      setAttachedFiles([])
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        setTimeout(() => textareaRef.current?.focus(), 0)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
    if (e.key === "Escape") {
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    const textarea = e.target
    textarea.style.height = "auto"
    const newHeight = Math.min(textarea.scrollHeight, window.innerWidth < 640 ? 120 : 200)
    textarea.style.height = `${newHeight}px`
  }

  const handleAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    files.forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 25MB.`)
        return
      }

      const newFile: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      }

      setAttachedFiles((prev) => [...prev, newFile])
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeAttachment = (fileId: string) => {
    setAttachedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === fileId)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.includes("text") || type.includes("document")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleSearch = () => {
    console.log("Search clicked")
  }

  const handleVoice = () => {
    setIsRecording(!isRecording)
    console.log("Voice recording:", !isRecording)
  }

  return (
    <div className="max-w-3xl mx-auto w-full">
      {attachedFiles.length > 0 && (
        <div className="mb-2 sm:mb-3 space-y-2">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">{getFileIcon(file.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                onClick={() => removeAttachment(file.id)}
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-end gap-1 sm:gap-2 p-2 sm:p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-sm focus-within:border-gray-300 dark:focus-within:border-gray-500 transition-all duration-200">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              onClick={handleAttach}
              aria-label="Attach files"
              disabled={disabled}
            >
              <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              onClick={handleSearch}
              aria-label="Search"
              disabled={disabled}
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT"
            disabled={disabled}
            className="flex-1 min-h-[20px] max-h-[120px] sm:max-h-[200px] resize-none border-0 bg-transparent p-0 text-sm sm:text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            rows={1}
            aria-label="Message input"
            aria-describedby="input-help"
          />

          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
                isRecording && "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
              )}
              onClick={handleVoice}
              aria-label={isRecording ? "Stop recording" : "Start voice recording"}
              disabled={disabled}
            >
              {isRecording ? (
                <Square className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>

            {(message.trim() || attachedFiles.length > 0) && (
              <Button
                type="submit"
                size="sm"
                disabled={disabled}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>

        <div id="input-help" className="sr-only">
          Press Enter to send, Shift+Enter for new line, Escape to clear
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,text/*,.pdf,.doc,.docx,.txt,.csv,.json,.py,.js,.ts,.html,.css,.md"
          aria-label="File input"
        />
      </form>
    </div>
  )
}
