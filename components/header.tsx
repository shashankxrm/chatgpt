"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, HelpCircle, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Mobile Hamburger Menu */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>

        {/* ChatGPT Title with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <span className="text-lg font-medium text-gray-900 dark:text-gray-100">ChatGPT</span>
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>ChatGPT</DropdownMenuItem>
            <DropdownMenuItem>GPT-4</DropdownMenuItem>
            <DropdownMenuItem>GPT-3.5</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center Section - Upgrade Button */}
      <div className="flex-1 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          className="bg-[#6366f1] hover:bg-[#5855eb] text-white border-[#6366f1] hover:border-[#5855eb] rounded-full px-4 py-1.5 text-sm font-medium"
        >
          Upgrade to Go
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />
        
        {/* Help Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800" 
          onClick={() => window.open("https://github.com/shashankxrm/chatgpt/blob/main/README.md", "_blank")}
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Button>
      </div>
    </header>
  )
}
