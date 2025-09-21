"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, X, FileText, ImageIcon, File, Mic, ArrowUp } from "lucide-react"

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  cloudinaryId?: string
  isUploading?: boolean
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  cloudinaryId?: string
}

interface UploadError {
  filename: string
  error: string
}

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: AttachedFile[]) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Show loading state
    const loadingFiles = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      isUploading: true
    }))

    setAttachedFiles((prev) => [...prev, ...loadingFiles])

    try {
      // Upload files to our API
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.uploadedFiles) {
        // Replace loading files with uploaded files
        setAttachedFiles((prev) => {
          const nonLoadingFiles = prev.filter(f => !f.isUploading)
          const uploadedFiles = result.uploadedFiles.map((uploaded: UploadedFile) => ({
            id: uploaded.id,
            name: uploaded.name,
            size: uploaded.size,
            type: uploaded.type,
            url: uploaded.url,
            cloudinaryId: uploaded.cloudinaryId
          }))
          return [...nonLoadingFiles, ...uploadedFiles]
        })

        console.log(`✅ Uploaded ${result.uploadedFiles.length} files successfully`)
      } else {
        // Remove loading files and show error
        setAttachedFiles((prev) => prev.filter(f => !f.isUploading))
        alert(`Upload failed: ${result.error || 'Unknown error'}`)
      }

      // Show any file-specific errors
      if (result.uploadErrors && result.uploadErrors.length > 0) {
        const errorMessages = result.uploadErrors.map((err: UploadError) => 
          `${err.filename}: ${err.error}`
        ).join('\n')
        alert(`Some files failed to upload:\n${errorMessages}`)
      }

    } catch (error) {
      // Remove loading files and show error
      setAttachedFiles((prev) => prev.filter(f => !f.isUploading))
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    }

    // Clear input
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
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                  {file.isUploading && <span className="ml-2 text-blue-500">Uploading...</span>}
                </div>
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
        <div className="chatgpt-input flex items-center bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-600 rounded-full px-3 md:px-4 py-2.5 md:py-3 shadow-sm hover:shadow-md transition-shadow">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-1 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
            onClick={handleAttach}
            aria-label="Attach files"
            disabled={disabled}
          >
            <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            disabled={disabled}
            className="flex-1 border-0 bg-transparent dark:bg-transparent text-sm md:text-base placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 resize-none min-h-[20px] max-h-[120px] md:max-h-[200px]"
            rows={1}
            aria-label="Message input"
            aria-describedby="input-help"
          />

          <div className="flex items-center gap-1 md:gap-2 ml-2 shrink-0">
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={disabled}
            >
              <Mic className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
            </Button>

            {(message.trim() || attachedFiles.length > 0) && (
              <Button
                type="submit"
                size="sm"
                disabled={disabled}
                className="p-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full"
                aria-label="Send message"
              >
                <ArrowUp className="w-3 h-3 md:w-4 md:h-4" />
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
