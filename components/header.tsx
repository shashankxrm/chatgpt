"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, HelpCircle, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserButton, useUser, SignInButton } from '@clerk/nextjs'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { isSignedIn, isLoaded } = useUser()

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
          {!isLoaded ? (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          ) : isSignedIn ? (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: "shadow-lg",
                }
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <Button
                variant="default"
                className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
              >
                Log in
              </Button>
            </SignInButton>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.open("https://github.com/shashankxrm/chatgpt/blob/main/README.md", "_blank")}>
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>
    </>
  )
}
