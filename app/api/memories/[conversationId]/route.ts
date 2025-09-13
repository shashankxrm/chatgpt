import { NextRequest, NextResponse } from "next/server"
import { processConversationMemory } from "@/lib/memory-manager"
import { connectDB, Memory } from "@/lib/models"

// GET /api/memories/[conversationId] - Get memory for specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    
    await connectDB()
    
    const memory = await Memory.findOne({ conversationId })
    
    if (!memory) {
      return NextResponse.json({
        success: true,
        memory: null,
        message: "No memory found for this conversation"
      })
    }

    return NextResponse.json({
      success: true,
      memory: {
        id: memory._id,
        conversationId: memory.conversationId,
        summary: memory.summary,
        keyPoints: memory.keyPoints.map(point => ({
          key: point.key,
          value: point.value,
          importance: point.importance,
          createdAt: point.createdAt
        })),
        totalTokens: memory.totalTokens,
        lastUpdated: memory.lastUpdated,
        version: memory.version
      }
    })
  } catch (error) {
    console.error("Error fetching conversation memory:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch conversation memory",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// POST /api/memories/[conversationId] - Process conversation and create/update memory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    
    // Process the conversation and update memory
    await processConversationMemory(conversationId)
    
    return NextResponse.json({
      success: true,
      message: "Memory processed successfully"
    })
  } catch (error) {
    console.error("Error processing conversation memory:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process conversation memory",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// DELETE /api/memories/[conversationId] - Delete memory for conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    
    await connectDB()
    
    const result = await Memory.findOneAndDelete({ conversationId })
    
    if (!result) {
      return NextResponse.json({
        success: true,
        message: "No memory found to delete"
      })
    }

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting conversation memory:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete conversation memory",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
