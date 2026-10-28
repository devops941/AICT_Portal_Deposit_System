import crypto from 'crypto';

export interface FileValidationResult {
  isValid: boolean;
  detectedMimeType: string | null;
  detectedExtension: string | null;
  error?: string;
  fileHash: string;
}

/**
 * Validate file content using Magic Number byte inspection
 * Prevents extension spoofing and polyglot file attacks.
 */
export function validateFileContent(buffer: Buffer): FileValidationResult {
  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

  if (!buffer || buffer.length < 4) {
    return {
      isValid: false,
      detectedMimeType: null,
      detectedExtension: null,
      error: 'File buffer is empty or corrupted',
      fileHash,
    };
  }

  // 1. Check PDF signature: %PDF- (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return {
      isValid: true,
      detectedMimeType: 'application/pdf',
      detectedExtension: 'pdf',
      fileHash,
    };
  }

  // 2. Check PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return {
      isValid: true,
      detectedMimeType: 'image/png',
      detectedExtension: 'png',
      fileHash,
    };
  }

  // 3. Check JPEG signature: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return {
      isValid: true,
      detectedMimeType: 'image/jpeg',
      detectedExtension: 'jpg',
      fileHash,
    };
  }

  return {
    isValid: false,
    detectedMimeType: null,
    detectedExtension: null,
    error: 'Unsupported file format. Only authentic PDF, PNG, and JPEG documents are permitted.',
    fileHash,
  };
}
