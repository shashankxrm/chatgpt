export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'image' | 'document' | 'video' | 'audio' | 'other';
}

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  // Images
  'image/jpeg': { type: 'image', maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/jpg': { type: 'image', maxSize: 10 * 1024 * 1024 },
  'image/png': { type: 'image', maxSize: 10 * 1024 * 1024 },
  'image/gif': { type: 'image', maxSize: 10 * 1024 * 1024 },
  'image/webp': { type: 'image', maxSize: 10 * 1024 * 1024 },
  'image/svg+xml': { type: 'image', maxSize: 2 * 1024 * 1024 }, // 2MB for SVG

  // Documents
  'application/pdf': { type: 'document', maxSize: 25 * 1024 * 1024 }, // 25MB
  'application/msword': { type: 'document', maxSize: 25 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'document', maxSize: 25 * 1024 * 1024 },
  'text/plain': { type: 'document', maxSize: 5 * 1024 * 1024 }, // 5MB
  'text/markdown': { type: 'document', maxSize: 5 * 1024 * 1024 },
  'text/csv': { type: 'document', maxSize: 10 * 1024 * 1024 }, // 10MB
  'application/json': { type: 'document', maxSize: 5 * 1024 * 1024 },
  'application/xml': { type: 'document', maxSize: 5 * 1024 * 1024 },

  // Videos (limited support)
  'video/mp4': { type: 'video', maxSize: 100 * 1024 * 1024 }, // 100MB
  'video/webm': { type: 'video', maxSize: 100 * 1024 * 1024 },
  'video/quicktime': { type: 'video', maxSize: 100 * 1024 * 1024 },

  // Audio
  'audio/mpeg': { type: 'audio', maxSize: 25 * 1024 * 1024 }, // 25MB
  'audio/mp3': { type: 'audio', maxSize: 25 * 1024 * 1024 },
  'audio/wav': { type: 'audio', maxSize: 25 * 1024 * 1024 },
  'audio/webm': { type: 'audio', maxSize: 25 * 1024 * 1024 },
} as const;

// Global file size limit (100MB)
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Validate file type and size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size first
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size too large. Maximum allowed size is ${formatFileSize(MAX_FILE_SIZE)}.`
    };
  }

  // Check if file type is supported
  const supportedType = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES];
  
  if (!supportedType) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Please upload images, documents, or media files.`
    };
  }

  // Check specific file type size limit
  if (file.size > supportedType.maxSize) {
    return {
      isValid: false,
      error: `File too large for ${supportedType.type} files. Maximum size: ${formatFileSize(supportedType.maxSize)}.`
    };
  }

  return {
    isValid: true,
    fileType: supportedType.type as 'image' | 'document' | 'video' | 'audio' | 'other'
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): {
  validFiles: File[];
  invalidFiles: { file: File; error: string }[];
  totalSize: number;
} {
  const validFiles: File[] = [];
  const invalidFiles: { file: File; error: string }[] = [];
  let totalSize = 0;

  // Check total files limit
  if (files.length > 10) {
    return {
      validFiles: [],
      invalidFiles: files.map(file => ({ file, error: 'Too many files. Maximum 10 files allowed.' })),
      totalSize: 0
    };
  }

  for (const file of files) {
    const validation = validateFile(file);
    
    if (validation.isValid) {
      validFiles.push(file);
      totalSize += file.size;
    } else {
      invalidFiles.push({ file, error: validation.error! });
    }
  }

  // Check total upload size (200MB limit for batch upload)
  const MAX_BATCH_SIZE = 200 * 1024 * 1024;
  if (totalSize > MAX_BATCH_SIZE) {
    return {
      validFiles: [],
      invalidFiles: files.map(file => ({ 
        file, 
        error: `Total upload size too large. Maximum batch size: ${formatFileSize(MAX_BATCH_SIZE)}.` 
      })),
      totalSize
    };
  }

  return { validFiles, invalidFiles, totalSize };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Generate safe filename for storage
 */
export function generateSafeFilename(originalName: string): string {
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const safeName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  return `${safeName}-${timestamp}-${randomStr}${extension ? '.' + extension : ''}`;
}
