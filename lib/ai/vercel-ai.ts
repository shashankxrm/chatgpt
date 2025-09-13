export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate a non-streaming response using Hugging Face Router API (Vercel AI SDK compatible)
 */
export async function generateChatResponse(
  messages: ChatMessage[],
  model: string = 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita'
): Promise<ChatResponse> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

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
        stream: false,
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
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error('Hugging Face API error:', error);
    throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a streaming response using Hugging Face Router API (Vercel AI SDK compatible)
 */
export async function* streamChatResponse(
  messages: ChatMessage[],
  model: string = 'Qwen/Qwen3-Next-80B-A3B-Instruct:novita'
): AsyncGenerator<{ content: string; done: boolean }, void, unknown> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

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
                content: '',
                done: true,
              };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                yield {
                  content,
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
    throw new Error(`Failed to stream AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test the Hugging Face connection
 */
export async function testHuggingFaceConnection(): Promise<boolean> {
  try {
    const result = await generateChatResponse([
      { role: 'user', content: 'Hello, are you working?' }
    ]);
    
    console.log('✅ Hugging Face test successful:', result.content);
    return true;
  } catch (error) {
    console.error('❌ Hugging Face test failed:', error);
    return false;
  }
}
