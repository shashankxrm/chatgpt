import { type NextRequest, NextResponse } from "next/server"
import { generateChatResponse, streamChatResponse, type ChatMessage } from "@/lib/ai/vercel-ai"
import { connectDB, Conversation, Message } from "@/lib/models"
import { processFileContent } from "@/lib/file-processing"
import { getConversationContext, getContextConfig } from "@/lib/context-manager"

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

    // Prepare messages for AI with context management
    const messages: ChatMessage[] = [
      ...contextResult.messages,
      {
        role: 'user',
        content: message + fileContext
      }
    ];

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
      attachments: attachments.map((att: any) => ({
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
        model: response.model,
        tokenCount: response.usage?.totalTokens
      });
      await assistantMessage.save();

      return NextResponse.json({
        id: response.id,
        content: response.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        conversation_id: conversation._id,
        model: response.model,
        usage: response.usage,
        context: {
          tokensUsed: contextResult.tokensUsed,
          messagesTrimmed: contextResult.messagesTrimmed,
          hasSummary: !!contextResult.summary
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
