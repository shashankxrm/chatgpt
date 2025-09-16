import { type NextRequest, NextResponse } from "next/server"
import { generateChatResponse, streamChatResponse, type ChatMessage } from "@/lib/ai/vercel-ai"
import { connectDB, Conversation, Message } from "@/lib/models"
import { getConversationContext } from "@/lib/context-manager"
import { getMemoryContext, processConversationMemory } from "@/lib/memory-manager"
import { processFileContent } from "@/lib/file-processing"
import { sendFileProcessingWebhook, sendChatWebhook } from "@/lib/webhook-utils"
import { withAuth, validateUserOwnership } from "@/lib/auth"

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  cloudinaryId?: string
}

export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { 
      message, 
      conversationId, 
      attachments = [],
      stream = false 
    } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Process attachments and extract content with AI analysis
    let fileContext = '';
    if (attachments && attachments.length > 0) {
      console.log(`📎 Processing ${attachments.length} attachments with AI analysis`);
      
      for (const attachment of attachments) {
        try {
          console.log(`🔄 Processing file: ${attachment.name} (${attachment.type})`);
          console.log(`🔗 File URL: ${attachment.url}`);
          
          // Handle Google Drive URLs specially
          let fileUrl = attachment.url;
          if (attachment.url.includes('drive.google.com/file/d/')) {
            const fileId = attachment.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (fileId) {
              fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
              console.log(`🔄 Converted Google Drive URL: ${fileUrl}`);
            }
          }
          
          // Fetch file from URL
          const fileResponse = await fetch(fileUrl);
          if (!fileResponse.ok) {
            throw new Error(`Failed to fetch file: ${fileResponse.status} - ${fileResponse.statusText}`);
          }
          
          const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
          console.log(`📦 File buffer size: ${fileBuffer.length} bytes`);
          
          // Process file with AI analysis
          const processedContent = await processFileContent(
            fileBuffer,
            attachment.type,
            attachment.name,
            attachment.url // Pass Cloudinary URL for AI analysis
          );
          
          console.log(`📄 Processed content:`, {
            hasText: !!processedContent.text,
            textLength: processedContent.text?.length || 0,
            hasError: !!processedContent.error,
            error: processedContent.error
          });
          
          // Send file processing webhook
          if (process.env.WEBHOOK_URL) {
            if (processedContent.error) {
              sendFileProcessingWebhook(process.env.WEBHOOK_URL, "file.failed", {
                filename: attachment.name,
                size: attachment.size,
                type: attachment.type,
                url: attachment.url,
                error: processedContent.error
              }).catch(error => {
                console.warn("Failed to send file failed webhook:", error);
              });
            } else {
              sendFileProcessingWebhook(process.env.WEBHOOK_URL, "file.processed", {
                filename: attachment.name,
                size: attachment.size,
                type: attachment.type,
                url: attachment.url,
                processedContent: processedContent.text
              }).catch(error => {
                console.warn("Failed to send file processed webhook:", error);
              });
            }
          }
          
          if (processedContent.error) {
            fileContext += `\n[File: ${attachment.name} - Error: ${processedContent.error}]`;
          } else {
            fileContext += `\n${processedContent.text}`;
            
            // Add vision analysis info if available
            if (processedContent.visionAnalysis && !processedContent.visionAnalysis.error) {
              console.log(`✅ AI analysis completed for: ${attachment.name}`);
            }
          }
        } catch (error) {
          console.error(`Error processing attachment ${attachment.name}:`, error);
          fileContext += `\n[File: ${attachment.name} - Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}]`;
        }
      }
      
      console.log(`📝 Final file context length: ${fileContext.length} characters`);
      console.log(`📝 File context preview: ${fileContext.substring(0, 200)}...`);
    }

    // Get conversation context with intelligent management
    let contextResult;
    if (conversationId) {
      contextResult = await getConversationContext(conversationId);
    } else {
      contextResult = {
        messages: [],
        tokensUsed: 0,
        messagesTrimmed: 0,
      };
    }

    // Get memory context for enhanced responses
    let memoryContext = '';
    if (conversationId) {
      console.log(`🔍 Retrieving memory context for conversation: ${conversationId}`);
      memoryContext = await getMemoryContext(conversationId, userId);
      console.log(`📝 Memory context retrieved: ${memoryContext ? 'Yes' : 'No'}`);
      if (memoryContext) {
        console.log(`📄 Memory context length: ${memoryContext.length} characters`);
      }
    } else {
      // For new conversations, get general memory context from all conversations
      console.log(`🔍 Retrieving general memory context for new conversation`);
      memoryContext = await getMemoryContext('general', userId);
      console.log(`📝 General memory context retrieved: ${memoryContext ? 'Yes' : 'No'}`);
      if (memoryContext) {
        console.log(`📄 General memory context length: ${memoryContext.length} characters`);
      }
    }

    // Prepare messages for AI with context management and memory
    const messages: ChatMessage[] = [];
    
    // Add memory context as system message if available
    if (memoryContext) {
      messages.push({
        role: 'system',
        content: `Previous conversation context:\n${memoryContext}`
      });
    }
    
    // Add conversation context
    messages.push(...contextResult.messages);
    
    // Add current user message
    const fullUserMessage = message + fileContext;
    console.log(`📝 User message length: ${message.length}`);
    console.log(`📝 File context length: ${fileContext.length}`);
    console.log(`📝 Full message length: ${fullUserMessage.length}`);
    console.log(`📝 Full message preview: ${fullUserMessage.substring(0, 300)}...`);
    
    messages.push({
      role: 'user',
      content: fullUserMessage
    });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      if (conversation) {
        // Validate user ownership
        validateUserOwnership(userId, conversation.userId);
      }
    }
    
    if (!conversation) {
      conversation = new Conversation({
        userId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messageCount: 0
      });
      await conversation.save();
    }

    // Save user message
    const userMessage = new Message({
      userId,
      conversationId: conversation._id,
      role: 'user',
      content: message,
      attachments: attachments.map((att: AttachedFile) => ({
        id: att.id,
        name: att.name,
        size: att.size,
        type: att.type,
        url: att.url,
        cloudinaryId: att.cloudinaryId
      }))
    });
    await userMessage.save();

    // Send webhook for message sent
    if (process.env.WEBHOOK_URL) {
      sendChatWebhook(process.env.WEBHOOK_URL, "message.sent", {
        messageId: userMessage._id.toString(),
        conversationId: conversation._id.toString(),
        content: message,
        attachments: attachments
      }).catch(error => {
        console.warn("Failed to send message webhook:", error);
      });
    }

    if (stream) {
      // Return streaming response using Vercel AI SDK compatible approach
      try {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              let fullResponse = '';
              
              for await (const chunk of streamChatResponse(messages)) {
                if (chunk.done) {
                  // Save assistant message
                  const assistantMessage = new Message({
                    userId,
                    conversationId: conversation._id,
                    role: 'assistant',
                    content: fullResponse,
                    model: 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita'
                  });
                  await assistantMessage.save();

                  // Process conversation memory asynchronously (don't wait for it)
                  processConversationMemory(conversation._id, userId).catch(error => {
                    console.error('Error processing conversation memory:', error);
                  });
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                  controller.close();
                  return;
                }
                
                fullResponse += chunk.content;
                
                const data = {
                  content: chunk.content,
                  done: false
                };
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              }
            } catch (error) {
              console.error('Streaming error:', error);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`));
              controller.close();
            }
          }
        });

        return new NextResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        console.error('Streaming error:', error);
        return NextResponse.json(
          { error: 'Streaming failed', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } else {
      // Non-streaming response using Vercel AI SDK
      const response = await generateChatResponse(messages);
      
      // Save assistant message
      const assistantMessage = new Message({
        userId,
        conversationId: conversation._id,
        role: 'assistant',
        content: response.content,
        aiModel: response.model,
        tokenCount: response.usage?.totalTokens
      });
      await assistantMessage.save();

      // Process conversation memory asynchronously (don't wait for it)
      console.log(`🧠 Processing memory for conversation: ${conversation._id}`);
      processConversationMemory(conversation._id, userId).then(() => {
        console.log(`✅ Memory processed successfully for conversation: ${conversation._id}`);
      }).catch(error => {
        console.error('❌ Error processing conversation memory:', error);
      });

      return NextResponse.json({
        id: response.id,
        content: response.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        conversation_id: conversation._id,
        aiModel: response.model,
        usage: response.usage,
        context: {
          tokensUsed: contextResult.tokensUsed,
          messagesTrimmed: contextResult.messagesTrimmed,
          hasSummary: !!contextResult.summary,
          hasMemory: !!memoryContext
        }
      });
    }

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process chat message",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
});
