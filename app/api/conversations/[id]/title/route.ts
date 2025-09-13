import { NextRequest, NextResponse } from "next/server"
import { connectDB, Conversation, Message } from "@/lib/models"
import { generateChatResponse } from "@/lib/ai/vercel-ai"

// POST /api/conversations/[id]/title - Generate title for conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();

    // Get conversation
    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get recent messages (first few messages to understand the topic)
    const messages = await Message.find({ conversationId: id })
      .sort({ timestamp: 1 })
      .limit(5) // Get first 5 messages
      .lean();

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages found in conversation" },
        { status: 400 }
      );
    }

    // Create a prompt for title generation
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const titlePrompt = `Based on the following conversation, generate a concise, descriptive title (maximum 50 characters). The title should capture the main topic or purpose of the conversation:

${conversationText}

Title:`;

    try {
      // Generate title using AI
      const response = await generateChatResponse([
        { role: 'user', content: titlePrompt }
      ]);

      // Clean up the title (remove quotes, extra spaces, etc.)
      let title = response.content.trim();
      
      // Remove quotes if present
      if ((title.startsWith('"') && title.endsWith('"')) || 
          (title.startsWith("'") && title.endsWith("'"))) {
        title = title.slice(1, -1);
      }
      
      // Limit to 50 characters
      if (title.length > 50) {
        title = title.substring(0, 47) + '...';
      }

      // Update conversation with new title
      conversation.title = title;
      conversation.updatedAt = new Date();
      await conversation.save();

      return NextResponse.json({
        success: true,
        title: title,
        conversation: {
          id: conversation._id,
          title: conversation.title,
          updatedAt: conversation.updatedAt
        }
      });
    } catch (aiError) {
      console.error("Error generating title with AI:", aiError);
      
      // Fallback to a simple title based on first message
      const firstMessage = messages[0];
      let fallbackTitle = firstMessage.content.substring(0, 50);
      if (fallbackTitle.length < firstMessage.content.length) {
        fallbackTitle += '...';
      }

      conversation.title = fallbackTitle;
      conversation.updatedAt = new Date();
      await conversation.save();

      return NextResponse.json({
        success: true,
        title: fallbackTitle,
        conversation: {
          id: conversation._id,
          title: conversation.title,
          updatedAt: conversation.updatedAt
        },
        note: "Title generated using fallback method"
      });
    }
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to generate conversation title",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
