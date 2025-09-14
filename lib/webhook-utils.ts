import crypto from "crypto"

// Webhook configuration
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your-webhook-secret-key"
const WEBHOOK_TIMEOUT = 5000 // 5 seconds

export interface WebhookEvent {
  id: string
  type: string
  timestamp: string
  data: Record<string, unknown>
}

export interface WebhookConfig {
  url: string
  secret?: string
  timeout?: number
  retries?: number
}

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
}

/**
 * Send webhook event
 */
export async function sendWebhook(
  config: WebhookConfig,
  event: WebhookEvent
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  try {
    const payload = JSON.stringify(event)
    const signature = generateWebhookSignature(payload, config.secret || WEBHOOK_SECRET)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || WEBHOOK_TIMEOUT)
    
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "User-Agent": "ChatGPT-Clone-Webhook/1.0"
      },
      body: payload,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`)
    }
    
    const responseData = await response.json()
    
    return {
      success: true,
      response: responseData
    }
    
  } catch (error) {
    console.error("Webhook send error:", error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

/**
 * Send webhook with retry logic
 */
export async function sendWebhookWithRetry(
  config: WebhookConfig,
  event: WebhookEvent,
  maxRetries: number = 3
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  let lastError: string = ""
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Webhook attempt ${attempt}/${maxRetries} for event ${event.id}`)
    
    const result = await sendWebhook(config, event)
    
    if (result.success) {
      console.log(`✅ Webhook sent successfully on attempt ${attempt}`)
      return result
    }
    
    lastError = result.error || "Unknown error"
    console.warn(`⚠️ Webhook attempt ${attempt} failed: ${lastError}`)
    
    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s, etc.
      console.log(`⏳ Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  console.error(`❌ Webhook failed after ${maxRetries} attempts: ${lastError}`)
  
  return {
    success: false,
    error: `Failed after ${maxRetries} attempts: ${lastError}`
  }
}

/**
 * Create webhook event
 */
export function createWebhookEvent(
  type: string,
  data: Record<string, unknown>,
  id?: string
): WebhookEvent {
  return {
    id: id || `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    data
  }
}

/**
 * Send file processing webhook
 */
export async function sendFileProcessingWebhook(
  webhookUrl: string,
  event: "file.uploaded" | "file.processed" | "file.failed",
  data: {
    filename: string
    size?: number
    type?: string
    url?: string
    processedContent?: string
    error?: string
  }
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const webhookEvent = createWebhookEvent("file.processing", {
    event,
    ...data
  })
  
  return sendWebhookWithRetry(
    { url: webhookUrl },
    webhookEvent
  )
}

/**
 * Send chat webhook
 */
export async function sendChatWebhook(
  webhookUrl: string,
  event: "message.sent" | "conversation.created" | "memory.updated",
  data: {
    messageId?: string
    conversationId?: string
    content?: string
    attachments?: unknown[]
    [key: string]: unknown
  }
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const webhookEvent = createWebhookEvent("chat.message", {
    event,
    ...data
  })
  
  return sendWebhookWithRetry(
    { url: webhookUrl },
    webhookEvent
  )
}

/**
 * Send system health webhook
 */
export async function sendSystemHealthWebhook(
  webhookUrl: string,
  status: "healthy" | "degraded" | "unhealthy",
  details?: Record<string, unknown>
): Promise<{ success: boolean; response?: unknown; error?: string }> {
  const webhookEvent = createWebhookEvent("system.health", {
    status,
    timestamp: new Date().toISOString(),
    details: details || {}
  })
  
  return sendWebhookWithRetry(
    { url: webhookUrl },
    webhookEvent
  )
}
