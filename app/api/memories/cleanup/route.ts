import { NextResponse } from "next/server"
import { cleanupMemories } from "@/lib/memory-manager"

// POST /api/memories/cleanup - Clean up old memories
export async function POST() {
  try {
    const deletedCount = await cleanupMemories()
    
    return NextResponse.json({
      success: true,
      message: `Memory cleanup completed`,
      deletedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error during memory cleanup:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Memory cleanup failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
