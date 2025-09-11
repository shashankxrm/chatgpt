import { ChatInterface } from "@/components/chat-interface"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"

export default function Home() {
  return (
    <div
      className="flex h-screen bg-white dark:bg-gray-900 overflow-hidden"
      role="application"
      aria-label="ChatGPT Interface"
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <Header />
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
