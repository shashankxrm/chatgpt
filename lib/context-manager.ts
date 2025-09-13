import Message from './models/message';
import { generateChatResponse } from './ai/vercel-ai';

export interface ContextConfig {
  maxTokens: number;
  model: string;
  systemPrompt?: string;
  preserveRecentMessages: number;
  summarizeThreshold: number;
}

export interface ContextResult {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  summary?: string;
  tokensUsed: number;
  messagesTrimmed: number;
}

// Model context window configurations
export const MODEL_CONTEXT_WINDOWS = {
  'Qwen/Qwen3-Next-80B-A3B-Instruct:novita': {
    maxTokens: 32000,
    recommendedTokens: 28000, // Leave buffer for response
  },
  'gpt-4': {
    maxTokens: 8192,
    recommendedTokens: 7000,
  },
  'gpt-4-turbo': {
    maxTokens: 128000,
    recommendedTokens: 120000,
  },
  'gpt-3.5-turbo': {
    maxTokens: 4096,
    recommendedTokens: 3500,
  },
} as const;

/**
 * Estimate token count for text (rough approximation)
 * This is a simplified tokenizer - in production, you'd use a proper tokenizer
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  // This is conservative and may overestimate
  return Math.ceil(text.length / 4);
}

/**
 * Calculate total token count for messages
 */
export function calculateMessageTokens(messages: Array<{ content: string; role: string }>): number {
  return messages.reduce((total, message) => {
    return total + estimateTokenCount(message.content);
  }, 0);
}

/**
 * Get context configuration for a model
 */
export function getContextConfig(model: string): ContextConfig {
  const modelConfig = MODEL_CONTEXT_WINDOWS[model as keyof typeof MODEL_CONTEXT_WINDOWS] || 
    MODEL_CONTEXT_WINDOWS['Qwen/Qwen3-Next-80B-A3B-Instruct:novita'];

  return {
    maxTokens: modelConfig.maxTokens,
    model,
    systemPrompt: 'You are a helpful AI assistant. You can help with various tasks including answering questions, providing explanations, and assisting with problem-solving. Be helpful, accurate, and concise in your responses.',
    preserveRecentMessages: 10, // Always keep last 10 messages
    summarizeThreshold: Math.floor(modelConfig.maxTokens * 0.7), // Summarize when 70% full
  };
}

/**
 * Summarize conversation history using AI
 */
export async function summarizeConversation(
  messages: Array<{ content: string; role: string; timestamp: Date }>,
  model: string
): Promise<string> {
  try {
    // Create a summary prompt
    const conversationText = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const summaryPrompt = `Please provide a concise summary of the following conversation. Focus on key topics, decisions, and important information that would be useful for continuing the conversation:

${conversationText}

Summary:`;

    const response = await generateChatResponse([
      { role: 'user', content: summaryPrompt }
    ], model);

    return response.content;
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    // Fallback to a simple truncation
    return `[Conversation summary: ${messages.length} messages about various topics]`;
  }
}

/**
 * Trim messages to fit within context window
 */
export function trimMessages(
  messages: Array<{ content: string; role: string; timestamp: Date }>,
  config: ContextConfig
): Array<{ content: string; role: string; timestamp: Date }> {
  if (messages.length <= config.preserveRecentMessages) {
    return messages;
  }

  // Always keep the most recent messages
  const recentMessages = messages.slice(-config.preserveRecentMessages);
  const olderMessages = messages.slice(0, -config.preserveRecentMessages);

  // Calculate tokens for recent messages
  const recentTokens = calculateMessageTokens(recentMessages);
  const availableTokens = config.maxTokens - recentTokens - 1000; // Leave buffer for response

  if (availableTokens <= 0) {
    // If even recent messages are too long, keep only the most recent ones
    return recentMessages.slice(-Math.floor(config.preserveRecentMessages / 2));
  }

  // Select older messages that fit in the remaining context
  const selectedOlderMessages: Array<{ content: string; role: string; timestamp: Date }> = [];
  let usedTokens = 0;

  for (let i = olderMessages.length - 1; i >= 0; i--) {
    const message = olderMessages[i];
    const messageTokens = estimateTokenCount(message.content);
    
    if (usedTokens + messageTokens <= availableTokens) {
      selectedOlderMessages.unshift(message);
      usedTokens += messageTokens;
    } else {
      break;
    }
  }

  return [...selectedOlderMessages, ...recentMessages];
}

/**
 * Manage context for a conversation
 */
export async function manageContext(
  messages: Array<{ content: string; role: string; timestamp: Date }>,
  model: string = 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita'
): Promise<ContextResult> {
  const config = getContextConfig(model);
  const totalTokens = calculateMessageTokens(messages);

  let result: ContextResult = {
    messages: messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
    tokensUsed: totalTokens,
    messagesTrimmed: 0,
  };

  // If we're within limits, return as-is
  if (totalTokens <= config.recommendedTokens) {
    return result;
  }

  console.log(`🔄 Context management: ${totalTokens} tokens (limit: ${config.recommendedTokens})`);

  // If we need to summarize
  if (totalTokens > config.summarizeThreshold) {
    console.log('📝 Summarizing conversation history...');
    
    // Split messages into older and recent
    const recentMessages = messages.slice(-config.preserveRecentMessages);
    const olderMessages = messages.slice(0, -config.preserveRecentMessages);

    if (olderMessages.length > 0) {
      // Summarize older messages
      const summary = await summarizeConversation(olderMessages, model);
      
      // Create a system message with the summary
      const summaryMessage = {
        role: 'system' as const,
        content: `Previous conversation summary: ${summary}`,
      };

      // Combine summary with recent messages
      result.messages = [
        summaryMessage,
        ...recentMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }))
      ];

      result.summary = summary;
      result.messagesTrimmed = olderMessages.length;
    }
  } else {
    // Just trim messages without summarization
    const trimmedMessages = trimMessages(messages, config);
    result.messages = trimmedMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
    result.messagesTrimmed = messages.length - trimmedMessages.length;
  }

  // Recalculate tokens
  result.tokensUsed = calculateMessageTokens(result.messages);

  console.log(`✅ Context managed: ${result.tokensUsed} tokens, ${result.messagesTrimmed} messages trimmed`);

  return result;
}

/**
 * Get conversation context for AI
 */
export async function getConversationContext(
  conversationId: string,
  model: string = 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita'
): Promise<ContextResult> {
  try {
    // Fetch messages from database
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .lean();

    if (messages.length === 0) {
      return {
        messages: [],
        tokensUsed: 0,
        messagesTrimmed: 0,
      };
    }

    // Manage context
    return await manageContext(messages, model);
  } catch (error) {
    console.error('Error getting conversation context:', error);
    throw new Error('Failed to get conversation context');
  }
}

/**
 * Test context management with sample data
 */
export async function testContextManagement(): Promise<void> {
  console.log('🧪 Testing context management...');

  // Create sample messages
  const sampleMessages = Array.from({ length: 50 }, (_, i) => ({
    content: `This is message ${i + 1} with some content that should be long enough to test token counting and context management. It contains various topics and information that would be useful for testing the summarization and trimming functionality.`,
    role: i % 2 === 0 ? 'user' : 'assistant',
    timestamp: new Date(Date.now() - (50 - i) * 60000), // 1 minute apart
  }));

  const result = await manageContext(sampleMessages);
  
  console.log('✅ Context management test results:');
  console.log(`- Original messages: ${sampleMessages.length}`);
  console.log(`- Final messages: ${result.messages.length}`);
  console.log(`- Messages trimmed: ${result.messagesTrimmed}`);
  console.log(`- Tokens used: ${result.tokensUsed}`);
  console.log(`- Summary: ${result.summary ? 'Yes' : 'No'}`);
}
