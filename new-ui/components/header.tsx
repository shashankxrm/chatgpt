"use client"

import { Button } from "@/components/ui/button"
import { ChevronDown, Settings, Menu } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

interface HeaderProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>

        <div className="flex items-center gap-1">
          <span className="text-lg font-medium text-gray-900 dark:text-gray-100">ChatGPT</span>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="bg-[#6366f1] hover:bg-[#5855eb] text-white border-[#6366f1] hover:border-[#5855eb] rounded-full px-4 py-1.5 text-sm font-medium"
        >
          Upgrade to Go
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>
      </div>
    </header>
  )
}
