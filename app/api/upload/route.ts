import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, validateCloudinaryConfig, generateUploadSignature } from '@/lib/cloudinary';
import { validateFiles, formatFileSize } from '@/lib/file-validation';

export const runtime = 'nodejs';

// Maximum request size (100MB)
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    // Validate Cloudinary configuration
    if (!validateCloudinaryConfig()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File upload service not configured. Please check Cloudinary settings.' 
        },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No files provided' 
        },
        { status: 400 }
      );
    }

    // Validate files
    const { validFiles, invalidFiles, totalSize } = validateFiles(files);

    if (validFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid files to upload',
          details: invalidFiles.map(({ file, error }) => ({
            filename: file.name,
            error
          }))
        },
        { status: 400 }
      );
    }

    console.log(`📁 Uploading ${validFiles.length} files (${formatFileSize(totalSize)})`);

    // Upload files to Cloudinary
    const uploadResults = [];
    const uploadErrors = [];

    for (const file of validFiles) {
      try {
        console.log(`⬆️  Uploading: ${file.name} (${formatFileSize(file.size)})`);
        
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine resource type based on file type
        let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
        if (file.type.startsWith('image/')) {
          resourceType = 'image';
        } else if (file.type.startsWith('video/')) {
          resourceType = 'video';
        } else {
          resourceType = 'raw'; // For documents and other files
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, {
          folder: 'chatgpt/uploads',
          resource_type: resourceType,
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          // Ensure files are publicly accessible
          access_mode: 'public',
          // For raw files, ensure they're accessible
          ...(resourceType === 'raw' && {
            resource_type: 'raw',
            access_mode: 'public'
          })
        });

        uploadResults.push({
          id: result.public_id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.secure_url,
          cloudinaryId: result.public_id,
          format: result.format,
          resourceType: result.resource_type,
          ...(result.width && result.height && {
            dimensions: {
              width: result.width,
              height: result.height
            }
          })
        });

        console.log(`✅ Uploaded: ${file.name} -> ${result.public_id}`);

      } catch (error) {
        console.error(`❌ Upload failed for ${file.name}:`, error);
        uploadErrors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    // Prepare response
    const response = {
      success: uploadResults.length > 0,
      message: `${uploadResults.length} of ${validFiles.length} files uploaded successfully`,
      uploadedFiles: uploadResults,
      totalSize: formatFileSize(totalSize),
      ...(uploadErrors.length > 0 && { uploadErrors }),
      ...(invalidFiles.length > 0 && { 
        invalidFiles: invalidFiles.map(({ file, error }) => ({
          filename: file.name,
          error
        }))
      })
    };

    const statusCode = uploadResults.length > 0 ? 200 : 500;
    return NextResponse.json(response, { status: statusCode });

  } catch (error) {
    console.error('Upload API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'File upload failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for upload configuration
export async function GET() {
  try {
    if (!validateCloudinaryConfig()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File upload service not configured' 
        },
        { status: 500 }
      );
    }

    // Generate upload signature for client-side uploads (if needed)
    const uploadConfig = generateUploadSignature('chatgpt/uploads');

    return NextResponse.json({
      success: true,
      config: {
        maxFileSize: '100MB',
        maxBatchSize: '200MB',
        maxFiles: 10,
        supportedTypes: [
          'Images: JPEG, PNG, GIF, WebP, SVG',
          'Documents: PDF, DOC, DOCX, TXT, MD, CSV, JSON, XML',
          'Media: MP4, WebM, MOV, MP3, WAV'
        ]
      },
      // Only include upload signature if specifically requested
      ...(uploadConfig && { uploadSignature: uploadConfig })
    });

  } catch (error) {
    console.error('Upload config error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get upload configuration'
      },
      { status: 500 }
    );
  }
}
