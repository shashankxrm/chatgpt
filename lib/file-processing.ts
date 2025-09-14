import mammoth from 'mammoth';
import { analyzeImage, generateImageContext, VisionAnalysis } from './ai/vision';

export interface ProcessedFileContent {
  text?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  visionAnalysis?: VisionAnalysis;
}

/**
 * Extract text content from PDF files
 */
export async function extractPdfText(buffer: Buffer): Promise<ProcessedFileContent> {
  try {
    console.log(`📄 Starting PDF extraction, buffer size: ${buffer.length} bytes`);
    
    // Basic PDF header check
    const header = buffer.toString('ascii', 0, 8);
    if (!header.startsWith('%PDF-')) {
      console.log('❌ Invalid PDF header:', header);
      return {
        error: 'Not a valid PDF file'
      };
    }
    
    console.log('✅ Valid PDF header detected');
    
    // Try pdf-parse first
    try {
      console.log('🔄 Attempting pdf-parse extraction...');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      
      // Create a clean buffer without any test file references
      const cleanBuffer = Buffer.from(buffer);
      const pdfData = await pdfParse(cleanBuffer);
      
      console.log(`✅ pdf-parse successful: ${pdfData.text.length} characters extracted`);
      console.log(`📄 First 200 chars: ${pdfData.text.substring(0, 200)}`);
      
      // Check if the extracted text is readable
      const readableText = pdfData.text.trim();
      const isReadable = readableText.length > 50 && 
        /[a-zA-Z]{3,}/.test(readableText) && // Contains at least 3 consecutive letters
        !/^[^\x20-\x7E]*$/.test(readableText); // Not all non-printable characters
      
      if (!isReadable) {
        console.log('⚠️ pdf-parse extracted text but it appears to be garbled');
        throw new Error('Extracted text is not readable');
      }
      
      const metadata: Record<string, unknown> = {
        size: buffer.length,
        type: 'application/pdf',
        hasValidHeader: true,
        pages: pdfData.numpages,
        hasExtractedText: pdfData.text && pdfData.text.length > 0,
        extractionMethod: 'pdf-parse',
        isReadable
      };
      
      // Add PDF metadata if available
      if (pdfData.info) {
        if (pdfData.info.Title) metadata.title = pdfData.info.Title;
        if (pdfData.info.Author) metadata.author = pdfData.info.Author;
        if (pdfData.info.Creator) metadata.creator = pdfData.info.Creator;
        if (pdfData.info.Subject) metadata.subject = pdfData.info.Subject;
      }
      
      return {
        text: readableText,
        metadata
      };
    } catch (pdfParseError) {
      console.log('❌ pdf-parse failed:', pdfParseError);
      
      // Fallback to enhanced pattern matching
      console.log('🔄 Attempting enhanced pattern matching...');
      const pdfContent = buffer.toString('ascii');
      
      // Look for text objects more comprehensively
      const textPatterns = [
        { pattern: /\((.*?)\)\s*Tj/g, type: 'standard' },
        { pattern: /\[(.*?)\]\s*TJ/g, type: 'array' },
        { pattern: /BT\s+(.*?)\s+ET/gs, type: 'block' }
      ];
      
      let extractedText = '';
      
      for (const { pattern, type } of textPatterns) {
        const matches = pdfContent.match(pattern);
        if (matches) {
          const text = matches
            .map(match => {
              if (type === 'block') {
                // Extract text from text blocks
                const textMatches = match.match(/\((.*?)\)\s*Tj/g);
                return textMatches ? textMatches.map(t => t.replace(/^\(|\)\s*Tj$/g, '')).join(' ') : '';
              } else {
                return match.replace(/^\(|\)\s*Tj$|^\[|\]\s*TJ$/g, '');
              }
            })
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (text.length > extractedText.length) {
            extractedText = text;
          }
        }
      }
      
      // Also try to extract from stream objects
      const streamMatches = pdfContent.match(/stream\s+(.*?)\s+endstream/gs);
      if (streamMatches) {
        for (const stream of streamMatches) {
          const streamText = stream
            .replace(/stream\s+/, '')
            .replace(/\s+endstream/, '')
            .replace(/[^\x20-\x7E]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ')
            .trim();
          
          if (streamText.length > 50 && streamText.length > extractedText.length) {
            extractedText = streamText;
          }
        }
      }
      
      console.log(`📝 Pattern matching extracted: ${extractedText.length} characters`);
      console.log(`📄 First 200 chars: ${extractedText.substring(0, 200)}`);
      
      // Check if the extracted text is readable
      const hasConsecutiveLetters = /[a-zA-Z]{3,}/.test(extractedText);
      const hasReadableWords = /(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|oil|sit|yes|yet|zoo)/i.test(extractedText);
      const hasTooManySpecialChars = /[~`@#$%^&*()_+=\[\]{}|\\:";'<>?,./]{5,}/.test(extractedText);
      const hasReasonableTextRatio = (extractedText.match(/[a-zA-Z\s]/g) || []).length / extractedText.length > 0.3; // At least 30% letters/spaces
      
      const isReadable = extractedText.length > 50 && 
        hasConsecutiveLetters && 
        (hasReadableWords || hasReasonableTextRatio) &&
        !hasTooManySpecialChars;
      
      if (isReadable) {
        return {
          text: extractedText,
          metadata: {
            size: buffer.length,
            type: 'application/pdf',
            hasValidHeader: true,
            hasExtractedText: true,
            extractionMethod: 'enhanced_pattern_matching',
            isReadable: true,
            fallbackReason: pdfParseError instanceof Error ? pdfParseError.message : 'pdf-parse failed'
          }
        };
      }
      
      return {
        text: `PDF file detected but content extraction failed. This appears to be an image-based PDF, scanned document, or PDF with complex formatting that cannot be parsed as text.

**What this means:**
- The PDF contains images or scanned content rather than selectable text
- The PDF may have security restrictions or complex encoding
- The content is not accessible through standard text extraction methods

**Suggestions:**
- If this is a scanned document, try using OCR (Optical Character Recognition) tools
- If this is a resume or document, consider converting it to a text-based PDF
- For image-based PDFs, you may need to describe the content manually

**File details:**
- Size: ${(buffer.length / 1024).toFixed(1)} KB
- Type: PDF document
- Status: Content not readable as text`,
        metadata: {
          error: pdfParseError instanceof Error ? pdfParseError.message : 'Unknown error',
          size: buffer.length,
          type: 'application/pdf',
          extractionMethod: 'failed',
          isImageBased: true,
          suggestions: [
            'Try using OCR tools for scanned documents',
            'Convert to text-based PDF if possible',
            'Describe content manually if needed'
          ]
        },
        error: 'Text extraction failed - PDF appears to be image-based or has complex formatting'
      };
    }
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      text: 'PDF file detected but content extraction failed. This might be an image-based PDF or have security restrictions.',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        size: buffer.length,
        type: 'application/pdf'
      },
      error: 'Text extraction failed - PDF may be image-based or protected'
    };
  }
}

/**
 * Extract text content from DOCX files
 */
export async function extractDocxText(buffer: Buffer): Promise<ProcessedFileContent> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    
    return {
      text: result.value,
      metadata: {
        messages: result.messages.map(msg => msg.message)
      }
    };
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return {
      error: 'Failed to extract text from DOCX'
    };
  }
}

/**
 * Extract text content from plain text files
 */
export async function extractTextContent(buffer: Buffer, encoding: BufferEncoding = 'utf8'): Promise<ProcessedFileContent> {
  try {
    const text = buffer.toString(encoding);
    
    return {
      text,
      metadata: {
        encoding,
        size: buffer.length,
        lines: text.split('\n').length
      }
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    return {
      error: 'Failed to extract text content'
    };
  }
}

/**
 * Parse CSV content
 */
export async function extractCsvContent(buffer: Buffer): Promise<ProcessedFileContent> {
  try {
    const text = buffer.toString('utf8');
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { error: 'CSV file is empty' };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim().replace(/"/g, ''))
    );

    // Convert to readable text format
    let readableText = `CSV Data with ${headers.length} columns and ${rows.length} rows:\n\n`;
    readableText += `Headers: ${headers.join(', ')}\n\n`;
    
    // Include first few rows as sample
    const sampleRows = rows.slice(0, 5);
    readableText += 'Sample data:\n';
    sampleRows.forEach((row, index) => {
      readableText += `Row ${index + 1}: ${row.join(', ')}\n`;
    });

    if (rows.length > 5) {
      readableText += `... and ${rows.length - 5} more rows`;
    }

    return {
      text: readableText,
      metadata: {
        headers,
        rowCount: rows.length,
        columnCount: headers.length,
        totalSize: buffer.length
      }
    };
  } catch (error) {
    console.error('CSV extraction error:', error);
    return {
      error: 'Failed to parse CSV content'
    };
  }
}

/**
 * Parse JSON content
 */
export async function extractJsonContent(buffer: Buffer): Promise<ProcessedFileContent> {
  try {
    const text = buffer.toString('utf8');
    const jsonData = JSON.parse(text);
    
    // Convert JSON to readable text
    const readableText = `JSON Data:\n\n${JSON.stringify(jsonData, null, 2)}`;
    
    return {
      text: readableText,
      metadata: {
        type: Array.isArray(jsonData) ? 'array' : typeof jsonData,
        keys: typeof jsonData === 'object' && !Array.isArray(jsonData) 
          ? Object.keys(jsonData) 
          : undefined,
        length: Array.isArray(jsonData) ? jsonData.length : undefined,
        size: buffer.length
      }
    };
  } catch (error) {
    console.error('JSON extraction error:', error);
    return {
      error: 'Failed to parse JSON content - invalid format'
    };
  }
}

/**
 * Extract metadata and analyze image files with AI
 */
export async function extractImageMetadata(buffer: Buffer, mimeType: string, filename: string, cloudinaryUrl?: string): Promise<ProcessedFileContent> {
  try {
    // Basic image metadata
    const metadata = {
      mimeType,
      size: buffer.length,
      format: mimeType.split('/')[1]
    };

    let readableText = `Image file (${metadata.format.toUpperCase()}) - ${(buffer.length / 1024 / 1024).toFixed(2)}MB`;
    let visionAnalysis: VisionAnalysis | undefined;

    // If we have a Cloudinary URL, perform AI analysis
    if (cloudinaryUrl) {
      try {
        console.log(`🔍 Analyzing image with AI: ${filename}`);
        visionAnalysis = await analyzeImage(cloudinaryUrl);
        
        if (visionAnalysis && !visionAnalysis.error) {
          readableText = generateImageContext(visionAnalysis, filename);
        } else {
          readableText += `\n[AI Analysis: ${visionAnalysis?.error || 'Failed to analyze image'}]`;
        }
      } catch (error) {
        console.warn('AI image analysis failed:', error);
        readableText += `\n[AI Analysis: Failed - ${error instanceof Error ? error.message : 'Unknown error'}]`;
      }
    } else {
      readableText += '\n[AI Analysis: Not available - no Cloudinary URL]';
    }

    return {
      text: readableText,
      metadata: {
        ...metadata,
        hasVisionAnalysis: !!visionAnalysis && !visionAnalysis.error
      },
      visionAnalysis
    };
  } catch (error) {
    console.error('Image metadata extraction error:', error);
    return {
      error: 'Failed to extract image metadata'
    };
  }
}


/**
 * Process file based on its type and extract relevant content
 */
export async function processFileContent(
  buffer: Buffer, 
  mimeType: string, 
  filename: string,
  cloudinaryUrl?: string
): Promise<ProcessedFileContent> {
  try {
    console.log(`🔄 Processing file: ${filename} (${mimeType})`);

    switch (mimeType) {
      case 'application/pdf':
        return await extractPdfText(buffer);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractDocxText(buffer);
      
      case 'text/plain':
      case 'text/markdown':
        return await extractTextContent(buffer);
      
      case 'text/csv':
        return await extractCsvContent(buffer);
      
      case 'application/json':
        return await extractJsonContent(buffer);
      
      case 'application/xml':
      case 'text/xml':
        return await extractTextContent(buffer);
      
      default:
        if (mimeType.startsWith('image/')) {
          return await extractImageMetadata(buffer, mimeType, filename, cloudinaryUrl);
        }
        
        if (mimeType.startsWith('text/')) {
          return await extractTextContent(buffer);
        }
        
        return {
          text: `File: ${filename} (${mimeType}) - Content not readable as text`,
          metadata: {
            mimeType,
            size: buffer.length,
            filename
          }
        };
    }
  } catch (error) {
    console.error(`File processing error for ${filename}:`, error);
    return {
      error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get a summary of file content for AI context
 */
export function getFileContextSummary(
  filename: string, 
  content: ProcessedFileContent, 
  maxLength: number = 1000
): string {
  if (content.error) {
    return `[File: ${filename} - Error: ${content.error}]`;
  }

  if (!content.text) {
    return `[File: ${filename} - No readable content]`;
  }

  let summary = `[File: ${filename}]\n${content.text}`;
  
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength - 20) + '... [truncated]';
  }

  return summary;
}
