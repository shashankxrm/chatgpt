import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/webhooks/test - Test webhook endpoint
 * This endpoint allows testing webhook functionality without signature verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create a test webhook event
    const testEvent = {
      id: `test-${Date.now()}`,
      type: body.type || "system.test",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook event",
        testData: body.testData || "No test data provided",
        ...body
      }
    }
    
    console.log("🧪 Test webhook received:", testEvent)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return NextResponse.json({
      success: true,
      message: "Test webhook processed successfully",
      eventId: testEvent.id,
      receivedData: testEvent.data,
      timestamp: testEvent.timestamp
    })
    
  } catch (error) {
    console.error("Test webhook error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "Test webhook failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/test - Test webhook info
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test webhook endpoint is active",
    usage: {
      method: "POST",
      url: "/api/webhooks/test",
      body: {
        type: "system.test | file.processing | chat.message",
        testData: "Any test data you want to send"
      }
    },
    examples: {
      "Basic test": {
        type: "system.test",
        testData: "Hello webhook!"
      },
      "File processing test": {
        type: "file.processing",
        event: "file.uploaded",
        filename: "test.pdf",
        size: 1024
      },
      "Chat test": {
        type: "chat.message",
        event: "message.sent",
        messageId: "msg-123",
        conversationId: "conv-456"
      }
    }
  })
}
