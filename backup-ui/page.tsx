import { ChatApp } from "@/components/chat-app"
import { ProtectedRoute } from "@/components/protected-route"

export default function Home() {
  return (
    <ProtectedRoute>
      <ChatApp />
    </ProtectedRoute>
  )
}
