"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar-new"
import { MainContent } from "./main-content-new"
import { Header } from "./header-new"

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false) // Collapsed by default on mobile
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121] text-black dark:text-white relative">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <MainContent />
      </div>
    </div>
  )
}
