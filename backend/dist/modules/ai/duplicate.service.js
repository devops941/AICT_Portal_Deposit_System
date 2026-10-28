"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateDetectionService = exports.DuplicateDetectionService = void 0;
const Fdr_model_1 = require("../../models/Fdr.model");
const AiExtraction_model_1 = require("../../models/AiExtraction.model");
const Document_model_1 = require("../../models/Document.model");
class DuplicateDetectionService {
    async detectDuplicates(params) {
        const { fileHash, fdrNumber, bankName, rawText, currentExtractionId, currentInstrumentId } = params;
        if (fileHash) {
            const matchedDoc = await Document_model_1.DocumentRecord.findOne({
                fileHash,
                ...(currentInstrumentId ? { instrumentId: { $ne: currentInstrumentId } } : {}),
            }).lean();
            if (matchedDoc) {
                return {
                    isDuplicateSuspected: true,
                    matchType: 'HASH_EXACT',
                    matchedInstrumentId: matchedDoc.instrumentId,
                    matchedDocumentId: matchedDoc.documentId,
                    similarityScore: 1.0,
                    details: `Exact SHA-256 cryptographic file hash match found with Document ${matchedDoc.documentId} on Instrument ${matchedDoc.instrumentId}.`,
                };
            }
            const matchedExtraction = await AiExtraction_model_1.AiExtraction.findOne({
                fileHash,
                ...(currentExtractionId ? { extractionId: { $ne: currentExtractionId } } : {}),
                ...(currentInstrumentId ? { instrumentId: { $ne: currentInstrumentId } } : {}),
            }).lean();
            if (matchedExtraction) {
                return {
                    isDuplicateSuspected: true,
                    matchType: 'HASH_EXACT',
                    matchedInstrumentId: matchedExtraction.instrumentId,
                    matchedDocumentId: matchedExtraction.documentId,
                    similarityScore: 1.0,
                    details: `Exact SHA-256 file hash match found with previous extraction ${matchedExtraction.extractionId}.`,
                };
            }
        }
        if (fdrNumber && fdrNumber.trim().length >= 4) {
            const normalizedCurrent = this.normalizeFdrNumber(fdrNumber);
            const existingFdrs = await Fdr_model_1.Fdr.find(currentInstrumentId ? { fdrId: { $ne: currentInstrumentId.toUpperCase() } } : {})
                .select('fdrId bankName fdrNumber institutionId')
                .lean();
            for (const existing of existingFdrs) {
                if (!existing.fdrNumber)
                    continue;
                const normalizedExisting = this.normalizeFdrNumber(existing.fdrNumber);
                if (normalizedCurrent === normalizedExisting) {
                    const isSameBank = bankName &&
                        existing.bankName &&
                        this.normalizeString(bankName) === this.normalizeString(existing.bankName);
                    return {
                        isDuplicateSuspected: true,
                        matchType: isSameBank ? 'BANK_AND_REF' : 'NORMALIZED_FDR',
                        matchedInstrumentId: existing.fdrId,
                        similarityScore: isSameBank ? 0.98 : 0.9,
                        details: isSameBank
                            ? `Both FDR Number (${fdrNumber}) and Bank (${bankName}) match registered instrument ${existing.fdrId}.`
                            : `Normalized FDR Number (${fdrNumber}) matches existing instrument ${existing.fdrId} (${existing.fdrNumber}).`,
                    };
                }
            }
        }
        if (rawText && rawText.length > 50) {
            const currentTokens = this.tokenize(rawText);
            if (currentTokens.size >= 10) {
                const recentExtractions = await AiExtraction_model_1.AiExtraction.find(currentExtractionId ? { extractionId: { $ne: currentExtractionId } } : {})
                    .sort({ createdAt: -1 })
                    .limit(20)
                    .select('extractionId instrumentId rawText')
                    .lean();
                for (const prev of recentExtractions) {
                    if (!prev.rawText || prev.rawText.length < 50)
                        continue;
                    const prevTokens = this.tokenize(prev.rawText);
                    const similarity = this.calculateJaccardSimilarity(currentTokens, prevTokens);
                    if (similarity >= 0.85) {
                        return {
                            isDuplicateSuspected: true,
                            matchType: 'HIGH_SIMILARITY',
                            matchedInstrumentId: prev.instrumentId,
                            similarityScore: parseFloat(similarity.toFixed(2)),
                            details: `Document text exhibits high textual similarity (${(similarity * 100).toFixed(1)}%) with extraction ${prev.extractionId}.`,
                        };
                    }
                }
            }
        }
        return {
            isDuplicateSuspected: false,
        };
    }
    normalizeFdrNumber(val) {
        return val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }
    normalizeString(val) {
        return val.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }
    tokenize(text) {
        const words = text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 3);
        return new Set(words);
    }
    calculateJaccardSimilarity(a, b) {
        let intersection = 0;
        for (const item of a) {
            if (b.has(item))
                intersection++;
        }
        const union = a.size + b.size - intersection;
        return union === 0 ? 0 : intersection / union;
    }
}
exports.DuplicateDetectionService = DuplicateDetectionService;
exports.duplicateDetectionService = new DuplicateDetectionService();
