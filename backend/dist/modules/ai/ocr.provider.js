"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ocrProvider = exports.NativeDocumentOcrProvider = void 0;
const logger_1 = require("../../config/logger");
class NativeDocumentOcrProvider {
    name = 'NATIVE_DOCUMENT_OCR';
    async extractText(buffer, mimeType, fileName = 'document.bin') {
        if (!buffer || buffer.length === 0) {
            return {
                text: '',
                confidence: 0,
                isUnreadable: true,
                metadata: { error: 'Empty file buffer received' },
            };
        }
        if (buffer.length < 8 && !buffer.toString('utf-8').trim()) {
            return {
                text: '',
                confidence: 0,
                isUnreadable: true,
                metadata: { error: 'Document is corrupt or unreadable' },
            };
        }
        try {
            if (mimeType === 'application/pdf') {
                const text = this.extractPdfText(buffer);
                if (!text || text.trim().length === 0) {
                    return {
                        text: '',
                        confidence: 10,
                        isUnreadable: true,
                        metadata: { format: 'SCANNED_PDF_NO_TEXT_LAYER' },
                    };
                }
                return {
                    text,
                    confidence: 95,
                    isUnreadable: false,
                    metadata: { format: 'PDF', length: text.length },
                };
            }
            if (mimeType.startsWith('image/')) {
                const imageText = this.extractImageText(buffer);
                return {
                    text: imageText,
                    confidence: imageText.trim().length > 15 ? 90 : 25,
                    isUnreadable: imageText.trim().length === 0,
                    metadata: { format: 'IMAGE', mimeType },
                };
            }
            const rawString = buffer.toString('utf-8');
            const printable = rawString.replace(/[^\x20-\x7E\t\r\n]/g, ' ');
            return {
                text: printable.trim(),
                confidence: printable.trim().length > 10 ? 80 : 0,
                isUnreadable: printable.trim().length === 0,
            };
        }
        catch (err) {
            logger_1.logger.warn(`OCR Extraction failed for ${fileName}: ${err.message}`);
            return {
                text: '',
                confidence: 0,
                isUnreadable: true,
                metadata: { error: err.message },
            };
        }
    }
    extractPdfText(buffer) {
        const raw = buffer.toString('latin1');
        const textPieces = [];
        const tjRegex = /\(([^)]+)\)\s*(?:Tj|'|")/g;
        let match;
        while ((match = tjRegex.exec(raw)) !== null) {
            textPieces.push(match[1]);
        }
        const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
        while ((match = arrayTjRegex.exec(raw)) !== null) {
            const inner = match[1];
            const partRegex = /\(([^)]+)\)/g;
            let partMatch;
            while ((partMatch = partRegex.exec(inner)) !== null) {
                textPieces.push(partMatch[1]);
            }
        }
        if (textPieces.length === 0) {
            const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
            while ((match = streamRegex.exec(raw)) !== null) {
                const streamData = match[1];
                const clean = streamData.replace(/[^\x20-\x7E\t\r\n]/g, ' ');
                if (clean.trim().length > 20) {
                    textPieces.push(clean.trim());
                }
            }
        }
        if (textPieces.length === 0) {
            const printable = raw.replace(/[^\x20-\x7E\t\r\n]/g, ' ');
            const words = printable.split(/\s+/).filter((w) => w.length > 2);
            if (words.length > 5) {
                return words.join(' ');
            }
        }
        return textPieces.join(' ').replace(/\s+/g, ' ').trim();
    }
    extractImageText(buffer) {
        const raw = buffer.toString('latin1');
        const clean = raw.replace(/[^\x20-\x7E\t\r\n]/g, ' ');
        const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
        if (tokens.length >= 4) {
            return tokens.join(' ');
        }
        return '';
    }
}
exports.NativeDocumentOcrProvider = NativeDocumentOcrProvider;
exports.ocrProvider = new NativeDocumentOcrProvider();
