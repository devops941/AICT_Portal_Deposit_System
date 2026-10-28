"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFileContent = validateFileContent;
const crypto_1 = __importDefault(require("crypto"));
function validateFileContent(buffer) {
    const fileHash = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
    if (!buffer || buffer.length < 4) {
        return {
            isValid: false,
            detectedMimeType: null,
            detectedExtension: null,
            error: 'File buffer is empty or corrupted',
            fileHash,
        };
    }
    if (buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46) {
        return {
            isValid: true,
            detectedMimeType: 'application/pdf',
            detectedExtension: 'pdf',
            fileHash,
        };
    }
    if (buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A) {
        return {
            isValid: true,
            detectedMimeType: 'image/png',
            detectedExtension: 'png',
            fileHash,
        };
    }
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
