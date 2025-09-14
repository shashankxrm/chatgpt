import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Webhook event types
interface WebhookEvent {
  id: string
  type: string
  timestamp: string
  data: Record<string, unknown>
}

// Webhook configuration
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your-webhook-secret-key"
const WEBHOOK_TIMEOUT = 5000 // 5 seconds

/**
 * Verify webhook signature for security
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")
    
    const providedSignature = signature.replace("sha256=", "")
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "hex"),
      Buffer.from(providedSignature, "hex")
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return false
  }
}

/**
 * Log webhook events for monitoring
 */
async function logWebhookEvent(event: WebhookEvent, status: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventId: event.id,
    eventType: event.type,
    status,
    data: event.data
  }
  
  console.log(`🔗 Webhook Event: ${JSON.stringify(logEntry, null, 2)}`)
  
  // In production, you might want to save this to a database
  // or send to a logging service like LogRocket, Sentry, etc.
}

/**
 * Process file processing webhook
 */
async function processFileWebhook(data: Record<string, unknown>) {
  try {
    console.log("📁 Processing file webhook:", data)
    
    // Handle different file processing events
    switch (data.event) {
      case "file.uploaded":
        console.log(`✅ File uploaded: ${data.filename} (${data.size} bytes)`)
        // You could trigger additional processing here
        break
        
      case "file.processed":
        const processedContent = data.processedContent as string | undefined
        console.log(`✅ File processed: ${data.filename} -> ${processedContent?.length || 0} characters`)
        // You could notify external systems about successful processing
        break
        
      case "file.failed":
        console.log(`❌ File processing failed: ${data.filename} - ${data.error}`)
        // You could send alerts or retry logic here
        break
        
      default:
        console.log(`ℹ️ Unknown file event: ${data.event}`)
    }
    
    return { success: true, message: "File webhook processed successfully" }
  } catch (error) {
    console.error("Error processing file webhook:", error)
    return { success: false, error: "Failed to process file webhook" }
  }
}

/**
 * Process chat webhook
 */
async function processChatWebhook(data: Record<string, unknown>) {
  try {
    console.log("💬 Processing chat webhook:", data)
    
    switch (data.event) {
      case "message.sent":
        console.log(`✅ Message sent: ${data.messageId} in conversation ${data.conversationId}`)
        break
        
      case "conversation.created":
        console.log(`✅ Conversation created: ${data.conversationId}`)
        break
        
      case "memory.updated":
        console.log(`✅ Memory updated for conversation: ${data.conversationId}`)
        break
        
      default:
        console.log(`ℹ️ Unknown chat event: ${data.event}`)
    }
    
    return { success: true, message: "Chat webhook processed successfully" }
  } catch (error) {
    console.error("Error processing chat webhook:", error)
    return { success: false, error: "Failed to process chat webhook" }
  }
}

/**
 * POST /api/webhooks - Main webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Get the raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get("x-webhook-signature") || ""
    
    // Verify webhook signature (optional - can be disabled for testing)
    if (process.env.NODE_ENV === "production" && !verifyWebhookSignature(body, signature, WEBHOOK_SECRET)) {
      console.warn("⚠️ Invalid webhook signature")
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }
    
    // Parse the webhook payload
    let event: WebhookEvent
    try {
      event = JSON.parse(body)
    } catch (error) {
      console.error("Invalid JSON payload:", error)
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      )
    }
    
    // Validate required fields
    if (!event.id || !event.type || !event.timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: id, type, timestamp" },
        { status: 400 }
      )
    }
    
    // Log the incoming webhook
    await logWebhookEvent(event, "received")
    
    // Process webhook based on type
    let result
    switch (event.type) {
      case "file.processing":
        result = await processFileWebhook(event.data)
        break
        
      case "chat.message":
        result = await processChatWebhook(event.data)
        break
        
      case "system.health":
        result = { success: true, message: "System is healthy", timestamp: new Date().toISOString() }
        break
        
      default:
        console.log(`ℹ️ Unknown webhook type: ${event.type}`)
        result = { success: true, message: "Webhook received but not processed" }
    }
    
    // Log the result
    await logWebhookEvent(event, result.success ? "processed" : "failed")
    
    // Check for timeout
    const processingTime = Date.now() - startTime
    if (processingTime > WEBHOOK_TIMEOUT) {
      console.warn(`⚠️ Webhook processing took ${processingTime}ms (timeout: ${WEBHOOK_TIMEOUT}ms)`)
    }
    
    return NextResponse.json({
      success: true,
      eventId: event.id,
      processingTime: `${processingTime}ms`,
      result
    })
    
  } catch (error) {
    console.error("Webhook processing error:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks - Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Webhook endpoint is active",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      "POST /api/webhooks": "Main webhook endpoint",
      "GET /api/webhooks": "Health check",
      "POST /api/webhooks/test": "Test webhook endpoint"
    }
  })
}
