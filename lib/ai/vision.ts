export interface VisionAnalysis {
  caption?: string;
  objects?: Array<{
    label: string;
    confidence: number;
  }>;
  classification?: Array<{
    label: string;
    score: number;
  }>;
  error?: string;
}

/**
 * Analyze image using Hugging Face vision models
 */
export async function analyzeImage(imageUrl: string): Promise<VisionAnalysis> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
  const HF_API_URL = 'https://api-inference.huggingface.co/models';

  if (!HF_API_KEY) {
    throw new Error('Hugging Face API key not configured');
  }

  try {
    // Fetch image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // Try multiple vision models for comprehensive analysis
    const results: VisionAnalysis = {};

    // 1. Image Captioning
    try {
      const captionResponse = await fetch(`${HF_API_URL}/Salesforce/blip-image-captioning-base`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageBase64,
        }),
      });

      if (captionResponse.ok) {
        const captionData = await captionResponse.json();
        if (Array.isArray(captionData) && captionData.length > 0) {
          results.caption = captionData[0].generated_text;
        }
      } else {
        console.warn('Image captioning failed:', captionResponse.status, await captionResponse.text());
      }
    } catch (error) {
      console.warn('Image captioning failed:', error);
    }

    // 2. Object Detection
    try {
      const objectResponse = await fetch(`${HF_API_URL}/facebook/detr-resnet-50`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageBase64,
        }),
      });

      if (objectResponse.ok) {
        const objectData = await objectResponse.json();
        if (Array.isArray(objectData)) {
          results.objects = objectData
            .filter((item: any) => item.score > 0.5) // Filter low confidence detections
            .map((item: any) => ({
              label: item.label,
              confidence: item.score,
            }))
            .slice(0, 10); // Limit to top 10 objects
        }
      } else {
        console.warn('Object detection failed:', objectResponse.status, await objectResponse.text());
      }
    } catch (error) {
      console.warn('Object detection failed:', error);
    }

    // 3. Image Classification
    try {
      const classificationResponse = await fetch(`${HF_API_URL}/google/vit-base-patch16-224`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageBase64,
        }),
      });

      if (classificationResponse.ok) {
        const classificationData = await classificationResponse.json();
        if (Array.isArray(classificationData) && classificationData.length > 0) {
          results.classification = classificationData[0]
            .slice(0, 5) // Top 5 classifications
            .map((item: any) => ({
              label: item.label,
              score: item.score,
            }));
        }
      } else {
        console.warn('Image classification failed:', classificationResponse.status, await classificationResponse.text());
      }
    } catch (error) {
      console.warn('Image classification failed:', error);
    }

    return results;
  } catch (error) {
    console.error('Vision analysis error:', error);
    return {
      error: `Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate a comprehensive image description for AI context
 */
export function generateImageContext(analysis: VisionAnalysis, filename: string): string {
  if (analysis.error) {
    return `[Image: ${filename} - Analysis Error: ${analysis.error}]`;
  }

  let context = `[Image: ${filename}]\n`;
  
  if (analysis.caption) {
    context += `Description: ${analysis.caption}\n`;
  }
  
  if (analysis.objects && analysis.objects.length > 0) {
    context += `Objects detected: ${analysis.objects.map(obj => `${obj.label} (${Math.round(obj.confidence * 100)}%)`).join(', ')}\n`;
  }
  
  if (analysis.classification && analysis.classification.length > 0) {
    context += `Classification: ${analysis.classification.map(cls => `${cls.label} (${Math.round(cls.score * 100)}%)`).join(', ')}\n`;
  }

  return context;
}

/**
 * Test vision model connection
 */
export async function testVisionConnection(): Promise<boolean> {
  try {
    // Test with a simple image URL (you can replace with any public image)
    const testImageUrl = 'https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg';
    const result = await analyzeImage(testImageUrl);
    
    console.log('✅ Vision model test successful:', result);
    return !result.error;
  } catch (error) {
    console.error('❌ Vision model test failed:', error);
    return false;
  }
}
