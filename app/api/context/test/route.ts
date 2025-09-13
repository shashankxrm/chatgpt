import { NextRequest, NextResponse } from "next/server"
import { testContextManagement, getContextConfig } from "@/lib/context-manager"
import { connectDB } from "@/lib/models"
import Message from "@/lib/models/message"

export async function GET() {
  try {
    await connectDB();
    
    // Run context management test
    await testContextManagement();
    
    return NextResponse.json({
      success: true,
      message: "Context management test completed successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Context management test error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Context management test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, model = 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita' } = await request.json();
    
    await connectDB();
    
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    // Get context configuration
    const config = getContextConfig(model);
    
    // Get conversation messages
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .lean();

    // Calculate context statistics
    const totalMessages = messages.length;
    const totalTokens = messages.reduce((total, msg) => {
      return total + Math.ceil(msg.content.length / 4); // Rough token estimation
    }, 0);

    const contextInfo = {
      conversationId,
      model,
      totalMessages,
      totalTokens,
      maxTokens: config.maxTokens,
      recommendedTokens: config.recommendedTokens,
      utilizationPercent: Math.round((totalTokens / config.maxTokens) * 100),
      needsManagement: totalTokens > config.recommendedTokens,
      config
    };

    return NextResponse.json({
      success: true,
      contextInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Context analysis error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Context analysis failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
