import { connectDB, Memory, Message } from '@/lib/models';
import { generateChatResponse } from '@/lib/ai/vercel-ai';

export interface MemoryContext {
  summary: string;
  keyPoints: Array<{
    key: string;
    value: string;
    importance: number;
  }>;
  totalTokens: number;
}

interface MemoryKeyPoint {
  key: string;
  value: string;
  importance: number;
  createdAt: Date;
}

export interface MemoryAnalysis {
  shouldCreateMemory: boolean;
  keyPoints: Array<{
    key: string;
    value: string;
    importance: number;
  }>;
  suggestedSummary: string;
}

/**
 * Analyze conversation messages to extract important information
 */
export async function analyzeConversationForMemory(
  conversationId: string,
  messages: Array<{ content: string; role: string; timestamp: Date }>
): Promise<MemoryAnalysis> {
  try {
    // Get recent messages (last 20) for analysis
    const recentMessages = messages.slice(-20);
    
    if (recentMessages.length < 4) {
      return {
        shouldCreateMemory: false,
        keyPoints: [],
        suggestedSummary: ''
      };
    }

    // Create analysis prompt
    const conversationText = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const analysisPrompt = `Analyze this conversation and extract important information for memory. Focus on:
1. Key facts, decisions, or important details mentioned
2. User preferences, names, or personal information
3. Technical information or solutions discussed
4. Goals or objectives mentioned

Conversation:
${conversationText}

Please provide:
1. A brief summary (1-2 sentences)
2. Key points in format: "Key: Value" (importance 1-10, where 10 is most important)

Format your response as JSON:
{
  "summary": "Brief summary here",
  "keyPoints": [
    {"key": "Topic", "value": "Details", "importance": 8}
  ]
}`;

    const response = await generateChatResponse([
      { role: 'user', content: analysisPrompt }
    ]);

    try {
      const analysis = JSON.parse(response.content);
      
      return {
        shouldCreateMemory: analysis.keyPoints && analysis.keyPoints.length > 0,
        keyPoints: analysis.keyPoints || [],
        suggestedSummary: analysis.summary || ''
      };
    } catch (parseError) {
      console.error('Error parsing memory analysis:', parseError);
      
      // Fallback: create basic memory from conversation
      const userMessages = recentMessages.filter(msg => msg.role === 'user');
      const assistantMessages = recentMessages.filter(msg => msg.role === 'assistant');
      
      if (userMessages.length > 0 && assistantMessages.length > 0) {
        return {
          shouldCreateMemory: true,
          keyPoints: [
            {
              key: 'Recent Discussion',
              value: userMessages[userMessages.length - 1].content.substring(0, 100) + '...',
              importance: 6
            }
          ],
          suggestedSummary: `Conversation about ${userMessages[userMessages.length - 1].content.substring(0, 50)}...`
        };
      }
      
      return {
        shouldCreateMemory: false,
        keyPoints: [],
        suggestedSummary: ''
      };
    }
  } catch (error) {
    console.error('Error analyzing conversation for memory:', error);
    return {
      shouldCreateMemory: false,
      keyPoints: [],
      suggestedSummary: ''
    };
  }
}

/**
 * Create or update memory for a conversation
 */
export async function createOrUpdateMemory(
  conversationId: string,
  analysis: MemoryAnalysis
): Promise<MemoryContext | null> {
  try {
    await connectDB();

    // Check if memory already exists
    let memory = await Memory.findOne({ conversationId });
    
    if (memory) {
      // Update existing memory
      memory.summary = analysis.suggestedSummary;
      
      // Add new key points
      for (const point of analysis.keyPoints) {
        memory.addKeyPoint(point.key, point.value, point.importance);
      }
      
      // Recalculate total tokens
      memory.totalTokens = calculateMemoryTokens(memory);
      
      await memory.save();
    } else {
      // Create new memory
      memory = new Memory({
        conversationId,
        summary: analysis.suggestedSummary,
        keyPoints: analysis.keyPoints.map(point => ({
          key: point.key,
          value: point.value,
          importance: point.importance,
          createdAt: new Date()
        })),
        totalTokens: calculateMemoryTokens({
          summary: analysis.suggestedSummary,
          keyPoints: analysis.keyPoints.map(point => ({
            key: point.key,
            value: point.value,
            importance: point.importance,
            createdAt: new Date()
          }))
        })
      });
      
      await memory.save();
    }

    return {
      summary: memory.summary,
      keyPoints: memory.keyPoints.map((point: MemoryKeyPoint) => ({
        key: point.key,
        value: point.value,
        importance: point.importance
      })),
      totalTokens: memory.totalTokens
    };
  } catch (error) {
    console.error('Error creating/updating memory:', error);
    return null;
  }
}

/**
 * Get memory context for a conversation
 */
export async function getMemoryContext(conversationId: string): Promise<string> {
  try {
    await connectDB();
    
    const memory = await Memory.findOne({ conversationId });
    
    if (!memory) {
      return '';
    }

    return memory.getContext();
  } catch (error) {
    console.error('Error getting memory context:', error);
    return '';
  }
}

/**
 * Get all memories for a user (across all conversations)
 */
export async function getAllMemories(): Promise<MemoryContext[]> {
  try {
    await connectDB();
    
    const memories = await Memory.find()
      .sort({ lastUpdated: -1 })
      .limit(50)
      .lean();

    return memories.map(memory => ({
      summary: memory.summary,
      keyPoints: memory.keyPoints.map((point: MemoryKeyPoint) => ({
        key: point.key,
        value: point.value,
        importance: point.importance
      })),
      totalTokens: memory.totalTokens
    }));
  } catch (error) {
    console.error('Error getting all memories:', error);
    return [];
  }
}

/**
 * Clean up old or less important memories
 */
export async function cleanupMemories(): Promise<number> {
  try {
    await connectDB();
    
    // Remove memories older than 30 days with low importance
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await Memory.deleteMany({
      lastUpdated: { $lt: thirtyDaysAgo },
      'keyPoints.importance': { $lt: 5 }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} old memories`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up memories:', error);
    return 0;
  }
}

/**
 * Calculate total tokens for memory
 */
function calculateMemoryTokens(memory: { summary: string; keyPoints: Array<MemoryKeyPoint> }): number {
  const summaryTokens = Math.ceil(memory.summary.length / 4);
  const keyPointsTokens = memory.keyPoints.reduce((total, point: MemoryKeyPoint) => {
    return total + Math.ceil(point.value.length / 4);
  }, 0);
  
  return summaryTokens + keyPointsTokens;
}

/**
 * Process conversation and update memory
 */
export async function processConversationMemory(conversationId: string): Promise<void> {
  try {
    console.log(`🔍 Processing memory for conversation: ${conversationId}`);
    await connectDB();
    
    // Get conversation messages
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .lean();

    console.log(`📊 Found ${messages.length} messages for conversation ${conversationId}`);

    if (messages.length < 2) {
      console.log(`⚠️ Not enough messages (${messages.length}) to create memory`);
      return; // Not enough messages to create memory
    }

    // Convert to expected format
    const formattedMessages = messages.map(msg => ({
      content: msg.content,
      role: msg.role,
      timestamp: msg.timestamp
    }));

    // Analyze conversation
    console.log(`🔬 Analyzing conversation for memory extraction...`);
    const analysis = await analyzeConversationForMemory(conversationId, formattedMessages);
    
    console.log(`📋 Analysis result:`, {
      shouldCreateMemory: analysis.shouldCreateMemory,
      keyPointsCount: analysis.keyPoints.length,
      summary: analysis.suggestedSummary.substring(0, 100) + '...'
    });
    
    if (analysis.shouldCreateMemory) {
      console.log(`💾 Creating/updating memory...`);
      const result = await createOrUpdateMemory(conversationId, analysis);
      if (result) {
        console.log(`✅ Memory updated for conversation ${conversationId}:`, {
          summary: result.summary.substring(0, 50) + '...',
          keyPoints: result.keyPoints.length,
          tokens: result.totalTokens
        });
      } else {
        console.log(`❌ Failed to create memory for conversation ${conversationId}`);
      }
    } else {
      console.log(`⚠️ No memory created - analysis determined no important information`);
    }
  } catch (error) {
    console.error('Error processing conversation memory:', error);
  }
}
