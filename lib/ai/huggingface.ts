// Note: HfInference import removed as it's not used in this file

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatStreamResponse {
  id: string;
  content: string;
  model: string;
  done: boolean;
}

/**
 * Send a chat completion request to Hugging Face
 */
export async function sendChatCompletion(
  messages: ChatMessage[],
  model: string = 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita',
  stream: boolean = false
): Promise<ChatResponse> {
  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        stream,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return {
      id: data.id,
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
    };
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Send a streaming chat completion request to Hugging Face
 */
export async function* sendChatCompletionStream(
  messages: ChatMessage[],
  model: string = 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita'
): AsyncGenerator<ChatStreamResponse, void, unknown> {
  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let messageId = '';
    let modelName = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              yield {
                id: messageId,
                content: '',
                model: modelName,
                done: true,
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.id) messageId = parsed.id;
              if (parsed.model) modelName = parsed.model;
              
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                yield {
                  id: messageId,
                  content,
                  model: modelName,
                  done: false,
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Hugging Face streaming error:', error);
    throw new Error(`Failed to get streaming AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test the Hugging Face API connection
 */
export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    const response = await sendChatCompletion([
      { role: 'user', content: 'Hello, are you working?' }
    ]);
    
    console.log('✅ Hugging Face API test successful:', response.content);
    return true;
  } catch (error) {
    console.error('❌ Hugging Face API test failed:', error);
    return false;
  }
}
