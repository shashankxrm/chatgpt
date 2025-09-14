"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, HelpCircle, Menu } from "lucide-react"
import { LoginModal } from "@/components/auth/login-modal"
import { SignupModal } from "@/components/auth/signup-modal"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  const handleSwitchToSignup = () => {
    setShowLogin(false)
    setShowSignup(true)
  }

  const handleSwitchToLogin = () => {
    setShowSignup(false)
    setShowLogin(true)
  }

  return (
    <>
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hamburger-menu"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* ChatGPT Title */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-lg font-semibold">
                ChatGPT
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>ChatGPT</DropdownMenuItem>
              <DropdownMenuItem>GPT-4</DropdownMenuItem>
              <DropdownMenuItem>GPT-3.5</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            onClick={() => setShowLogin(true)}
          >
            Log in
          </Button>
          {/* <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg bg-transparent sm:hidden"
            onClick={() => setShowSignup(true)}
          >
            Sign up for free
          </Button> */}
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.open("https://github.com/shashankxrm/chatgpt/blob/main/README.md", "_blank")}>
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSwitchToSignup={handleSwitchToSignup} />
      <SignupModal isOpen={showSignup} onClose={() => setShowSignup(false)} onSwitchToLogin={handleSwitchToLogin} />
    </>
  )
}
