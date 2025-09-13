import { NextRequest, NextResponse } from 'next/server';
import { processFileContent } from '@/lib/file-processing';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, filename, mimeType } = await request.json();

    if (!fileUrl || !filename || !mimeType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters: fileUrl, filename, mimeType' 
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing file: ${filename} (${mimeType})`);

    // Fetch the file from Cloudinary
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

    // Process the file content with AI analysis
    const processedContent = await processFileContent(
      fileBuffer,
      mimeType,
      filename,
      fileUrl // Pass Cloudinary URL for AI analysis
    );

    console.log(`✅ Processed file: ${filename}`);

    return NextResponse.json({
      success: true,
      processedContent,
      filename,
      mimeType,
      hasVisionAnalysis: !!processedContent.visionAnalysis && !processedContent.visionAnalysis.error
    });

  } catch (error) {
    console.error('File processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
