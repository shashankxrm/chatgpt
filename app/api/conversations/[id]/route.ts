import { NextRequest, NextResponse } from "next/server"
import { connectDB, Conversation, Message } from "@/lib/models"

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(
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

    // Get messages for this conversation
    const messages = await Message.find({ conversationId: id })
      .sort({ timestamp: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messageCount
      },
      messages: messages.map(msg => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        attachments: msg.attachments || [],
        model: msg.aiModel,
        isEdited: msg.isEdited || false,
        editedAt: msg.editedAt
      }))
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch conversation",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id] - Update conversation (title, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await request.json();
    
    await connectDB();

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Update conversation
    if (title) {
      conversation.title = title;
      conversation.updatedAt = new Date();
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
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to update conversation",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();

    // Delete all messages for this conversation
    await Message.deleteMany({ conversationId: id });
    
    // Delete the conversation
    await Conversation.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to delete conversation",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
