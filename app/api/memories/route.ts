import { NextResponse } from "next/server"
import { getAllMemories, cleanupMemories } from "@/lib/memory-manager"
import { withAuth } from "@/lib/auth"

// GET /api/memories - Get all memories for authenticated user
export const GET = withAuth(async (request, userId: string) => {
  try {
    const memories = await getAllMemories(userId)
    
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
});

// DELETE /api/memories - Clean up old memories for authenticated user
export const DELETE = withAuth(async (request, userId: string) => {
  try {
    const deletedCount = await cleanupMemories(userId)
    
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
});
