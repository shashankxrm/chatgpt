import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ProcessedFileContent {
  text?: string;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Extract text content from PDF files
 */
export async function extractPdfText(buffer: Buffer): Promise<ProcessedFileContent> {
  try {
    const data = await pdfParse(buffer);
    
    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
        version: data.version
      }
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      error: 'Failed to extract text from PDF'
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
 * Extract metadata from image files (basic info)
 */
export async function extractImageMetadata(buffer: Buffer, mimeType: string): Promise<ProcessedFileContent> {
  try {
    // Basic image metadata
    const metadata = {
      mimeType,
      size: buffer.length,
      format: mimeType.split('/')[1]
    };

    // For now, we'll just return basic info
    // In a full implementation, you might use libraries like 'sharp' or 'jimp'
    // to extract EXIF data, dimensions, etc.
    
    const readableText = `Image file (${metadata.format.toUpperCase()}) - ${(buffer.length / 1024 / 1024).toFixed(2)}MB`;

    return {
      text: readableText,
      metadata
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
  filename: string
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
          return await extractImageMetadata(buffer, mimeType);
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
