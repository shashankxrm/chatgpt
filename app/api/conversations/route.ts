import { NextRequest, NextResponse } from "next/server"
import { connectDB, Conversation, Message } from "@/lib/models"

// GET /api/conversations - Get all conversations
export async function GET() {
  try {
    await connectDB();

    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .limit(50) // Limit to recent 50 conversations
      .lean();

    return NextResponse.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv._id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messageCount
      }))
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch conversations",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const { title, message } = await request.json();
    
    await connectDB();

    // Create new conversation
    const conversation = new Conversation({
      title: title || 'New Conversation',
      messageCount: 0
    });
    
    await conversation.save();

    // If there's an initial message, save it
    if (message) {
      const userMessage = new Message({
        conversationId: conversation._id,
        role: 'user',
        content: message
      });
      await userMessage.save();

      // Update conversation message count
      conversation.messageCount = 1;
      await conversation.save();
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messageCount
      }
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create conversation",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE /api/conversations - Delete all conversations (for testing)
export async function DELETE() {
  try {
    await connectDB();

    // Delete all messages first
    await Message.deleteMany({});
    
    // Then delete all conversations
    await Conversation.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All conversations deleted"
    });
  } catch (error) {
    console.error("Error deleting conversations:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete conversations",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}