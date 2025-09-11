import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  // Placeholder for fetching user's conversation history
  const mockConversations = [
    {
      id: "conv_1",
      title: "React best practices",
      last_message: "Thanks for the explanation!",
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      message_count: 8,
    },
    {
      id: "conv_2",
      title: "TypeScript interfaces",
      last_message: "How do I extend interfaces?",
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      message_count: 12,
    },
    {
      id: "conv_3",
      title: "Next.js routing",
      last_message: "Perfect, that works!",
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      message_count: 6,
    },
  ]

  return NextResponse.json({ conversations: mockConversations })
}

export async function POST(request: NextRequest) {
  // Placeholder for creating new conversation
  const { title } = await request.json()

  const newConversation = {
    id: `conv_${Date.now()}`,
    title: title || "New conversation",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    message_count: 0,
  }

  return NextResponse.json(newConversation)
}
