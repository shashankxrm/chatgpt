import { ChatInterface } from "@/components/chat-interface-new"
import { ProtectedRoute } from "@/components/protected-route"

export default function Home() {
  return (
    <ProtectedRoute>
      <ChatInterface />
    </ProtectedRoute>
  )
}
