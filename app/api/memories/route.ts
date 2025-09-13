import { NextRequest, NextResponse } from "next/server"
import { getAllMemories, cleanupMemories } from "@/lib/memory-manager"

// GET /api/memories - Get all memories
export async function GET() {
  try {
    const memories = await getAllMemories()
    
    return NextResponse.json({
      success: true,
      memories,
      count: memories.length
    })
  } catch (error) {
    console.error("Error fetching memories:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch memories",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}

// DELETE /api/memories - Clean up old memories
export async function DELETE() {
  try {
    const deletedCount = await cleanupMemories()
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} old memories`,
      deletedCount
    })
  } catch (error) {
    console.error("Error cleaning up memories:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to clean up memories",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
