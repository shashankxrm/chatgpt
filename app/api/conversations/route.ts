import { NextRequest, NextResponse } from "next/server"
import { connectDB, Conversation, Message, Memory } from "@/lib/models"
import { withAuth } from "@/lib/auth"

// GET /api/conversations - Get all conversations for authenticated user
export const GET = withAuth(async (request: NextRequest, userId: string) => {
  try {
    await connectDB();

    const conversations = await Conversation.find({ userId })
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
});

// POST /api/conversations - Create new conversation for authenticated user
export const POST = withAuth(async (request: NextRequest, userId: string) => {
  try {
    const { title, message } = await request.json();
    
    await connectDB();

    // Create new conversation
    const conversation = new Conversation({
      userId,
      title: title || 'New Conversation',
      messageCount: 0
    });
    
    await conversation.save();

    // If there's an initial message, save it
    if (message) {
      const userMessage = new Message({
        userId,
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
});

// DELETE /api/conversations - Delete all conversations and memories for authenticated user (for testing)
export const DELETE = withAuth(async (request: NextRequest, userId: string) => {
  try {
    await connectDB();

    // Delete all messages for this user first
    const messageResult = await Message.deleteMany({ userId });
    console.log(`🗑️ Deleted ${messageResult.deletedCount} messages for user ${userId}`);
    
    // Delete all conversations for this user
    const conversationResult = await Conversation.deleteMany({ userId });
    console.log(`🗑️ Deleted ${conversationResult.deletedCount} conversations for user ${userId}`);
    
    // Delete all memories for this user
    const memoryResult = await Memory.deleteMany({ userId });
    console.log(`🗑️ Deleted ${memoryResult.deletedCount} memories for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "All conversations, messages, and memories deleted for user",
      deletedCounts: {
        messages: messageResult.deletedCount,
        conversations: conversationResult.deletedCount,
        memories: memoryResult.deletedCount
      }
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
});