import { type NextRequest, NextResponse } from "next/server"
import { generateChatResponse, streamChatResponse, type ChatMessage } from "@/lib/ai/vercel-ai"
import { connectDB, Conversation, Message } from "@/lib/models"
import { getConversationContext } from "@/lib/context-manager"
import { getMemoryContext, processConversationMemory } from "@/lib/memory-manager"

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  cloudinaryId?: string
}

export async function POST(request: NextRequest) {
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

    // Process attachments and extract content
    let fileContext = '';
    if (attachments && attachments.length > 0) {
      console.log(`📎 Processing ${attachments.length} attachments`);
      
      for (const attachment of attachments) {
        try {
          // For now, we'll just include basic file info
          // In a full implementation, you'd fetch and process the file content
          fileContext += `\n[Attached file: ${attachment.name} (${attachment.type})]`;
        } catch (error) {
          console.error('Error processing attachment:', error);
        }
      }
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
      memoryContext = await getMemoryContext(conversationId);
      console.log(`📝 Memory context retrieved: ${memoryContext ? 'Yes' : 'No'}`);
      if (memoryContext) {
        console.log(`📄 Memory context length: ${memoryContext.length} characters`);
      }
    } else {
      // For new conversations, get general memory context from all conversations
      console.log(`🔍 Retrieving general memory context for new conversation`);
      memoryContext = await getMemoryContext('general');
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
    messages.push({
      role: 'user',
      content: message + fileContext
    });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }
    
    if (!conversation) {
      conversation = new Conversation({
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messageCount: 0
      });
      await conversation.save();
    }

    // Save user message
    const userMessage = new Message({
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
                    conversationId: conversation._id,
                    role: 'assistant',
                    content: fullResponse,
                    model: 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita'
                  });
                  await assistantMessage.save();

                  // Process conversation memory asynchronously (don't wait for it)
                  processConversationMemory(conversation._id).catch(error => {
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

        return new Response(stream, {
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
        conversationId: conversation._id,
        role: 'assistant',
        content: response.content,
        aiModel: response.model,
        tokenCount: response.usage?.totalTokens
      });
      await assistantMessage.save();

      // Process conversation memory asynchronously (don't wait for it)
      console.log(`🧠 Processing memory for conversation: ${conversation._id}`);
      processConversationMemory(conversation._id).then(() => {
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
}
