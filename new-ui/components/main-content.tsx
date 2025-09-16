"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Paperclip, ArrowUp } from "lucide-react"
import { useState } from "react"

export function MainContent() {
  const [message, setMessage] = useState("")

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-xl md:text-2xl font-normal text-gray-800 dark:text-gray-200 mb-6 md:mb-8 text-balance">
            {"What's on the agenda today?"}
          </h1>

          <div className="relative">
            <div className="chatgpt-input flex items-center bg-white dark:bg-[#2f2f2f] border border-gray-200 dark:border-gray-600 rounded-full px-3 md:px-4 py-2.5 md:py-3 shadow-sm hover:shadow-md transition-shadow">
              <Button variant="ghost" size="sm" className="p-1 mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
                <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              </Button>

              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything"
                className="flex-1 border-0 bg-transparent text-sm md:text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              />

              <div className="flex items-center gap-1 md:gap-2 ml-2 shrink-0">
                <Button variant="ghost" size="sm" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Mic className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                </Button>

                {message.trim() && (
                  <Button
                    size="sm"
                    className="p-1.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full"
                  >
                    <ArrowUp className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
