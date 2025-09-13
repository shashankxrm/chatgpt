import { NextRequest, NextResponse } from "next/server"
import { connectDB, Conversation, Message } from "@/lib/models"
import { generateChatResponse } from "@/lib/ai/vercel-ai"

// PUT /api/conversations/[id]/messages/[messageId] - Edit message
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id: conversationId, messageId } = await params;
    const { content, regenerate = false } = await request.json();
    
    await connectDB();

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get the message to edit
    const message = await Message.findById(messageId);
    if (!message || message.conversationId !== conversationId) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Update the message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    let response = null;

    // If this is a user message and regenerate is requested, generate new AI response
    if (regenerate && message.role === 'user') {
      try {
        // Get conversation context
        const messages = await Message.find({ conversationId })
          .sort({ timestamp: 1 })
          .lean();

        // Prepare messages for AI (including the edited message)
        const aiMessages = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        }));

        // Generate new AI response
        const aiResponse = await generateChatResponse(aiMessages);

        // Save the new AI response
        const assistantMessage = new Message({
          conversationId: conversationId,
          role: 'assistant',
          content: aiResponse.content,
          model: aiResponse.model,
          tokenCount: aiResponse.usage?.totalTokens
        });
        await assistantMessage.save();

        response = {
          id: assistantMessage._id,
          content: assistantMessage.content,
          role: 'assistant',
          timestamp: assistantMessage.timestamp,
          model: assistantMessage.model
        };
      } catch (aiError) {
        console.error("Error regenerating AI response:", aiError);
        // Continue without regenerating if AI fails
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message._id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
        isEdited: message.isEdited,
        editedAt: message.editedAt
      },
      regeneratedResponse: response
    });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to edit message",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id]/messages/[messageId] - Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id: conversationId, messageId } = await params;
    
    await connectDB();

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete the message
    const result = await Message.findByIdAndDelete(messageId);
    if (!result) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Update conversation message count
    conversation.messageCount = Math.max(0, conversation.messageCount - 1);
    conversation.updatedAt = new Date();
    await conversation.save();

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete message",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
