import { NextResponse } from "next/server"
import { connectDB, Conversation, Message } from "@/lib/models"

export async function GET() {
  try {
    console.log("🔍 Testing database connection...")
    
    // Test connection
    await connectDB()
    console.log("✅ Database connected successfully")
    
    // Test queries
    const conversationCount = await Conversation.countDocuments()
    const messageCount = await Message.countDocuments()
    
    // Get recent conversations
    const recentConversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean()
    
    console.log("📊 Database stats:", {
      conversations: conversationCount,
      messages: messageCount,
      recentConversations: recentConversations.length
    })
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      stats: {
        conversations: conversationCount,
        messages: messageCount,
        recentConversations: recentConversations.map(conv => ({
          id: conv._id,
          title: conv.title,
          updatedAt: conv.updatedAt,
          messageCount: conv.messageCount
        }))
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        mongoUriPrefix: process.env.MONGODB_URI?.substring(0, 20) + "..."
      }
    })
    
  } catch (error) {
    console.error("❌ Database test failed:", error)
    
    return NextResponse.json({
      success: false,
      error: "Database connection failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        mongoUriPrefix: process.env.MONGODB_URI?.substring(0, 20) + "..."
      }
    }, { status: 500 })
  }
}
