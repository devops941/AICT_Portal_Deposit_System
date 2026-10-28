import { Fdr } from '../../models/Fdr.model';
import { AiExtraction, IDuplicateRiskFlag } from '../../models/AiExtraction.model';
import { DocumentRecord } from '../../models/Document.model';
import { logger } from '../../config/logger';

export class DuplicateDetectionService {
  /**
   * Run multi-faceted duplicate detection
   * 1. SHA-256 File Hash Matching
   * 2. Normalized FDR Number Matching
   * 3. Bank Name & FDR Reference Matching
   * 4. Text Similarity (Jaccard token comparison)
   */
  async detectDuplicates(params: {
    fileHash: string;
    fdrNumber?: string;
    bankName?: string;
    rawText?: string;
    currentExtractionId?: string;
    currentInstrumentId?: string;
  }): Promise<IDuplicateRiskFlag> {
    const { fileHash, fdrNumber, bankName, rawText, currentExtractionId, currentInstrumentId } = params;

    // 1. SHA-256 Exact File Hash Matching
    if (fileHash) {
      // Check in DocumentRecord collection
      const matchedDoc = await DocumentRecord.findOne({
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

      // Check in AiExtraction collection
      const matchedExtraction = await AiExtraction.findOne({
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

    // 2. Normalized FDR Number Matching
    if (fdrNumber && fdrNumber.trim().length >= 4) {
      const normalizedCurrent = this.normalizeFdrNumber(fdrNumber);

      // Search all existing FDRs (excluding the current one)
      const existingFdrs = await Fdr.find(
        currentInstrumentId ? { fdrId: { $ne: currentInstrumentId.toUpperCase() } } : {}
      )
        .select('fdrId bankName fdrNumber institutionId')
        .lean();

      for (const existing of existingFdrs) {
        if (!existing.fdrNumber) continue;
        const normalizedExisting = this.normalizeFdrNumber(existing.fdrNumber);

        // Check exact match on normalized FDR number
        if (normalizedCurrent === normalizedExisting) {
          // 3. Bank & FDR reference matching (even higher specificity if bank matches)
          const isSameBank =
            bankName &&
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

    // 4. Text Similarity Analysis (Jaccard token comparison)
    if (rawText && rawText.length > 50) {
      const currentTokens = this.tokenize(rawText);
      if (currentTokens.size >= 10) {
        const recentExtractions = await AiExtraction.find(
          currentExtractionId ? { extractionId: { $ne: currentExtractionId } } : {}
        )
          .sort({ createdAt: -1 })
          .limit(20)
          .select('extractionId instrumentId rawText')
          .lean();

        for (const prev of recentExtractions) {
          if (!prev.rawText || prev.rawText.length < 50) continue;
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

  private normalizeFdrNumber(val: string): string {
    return val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  private normalizeString(val: string): string {
    return val.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  private tokenize(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return new Set(words);
  }

  private calculateJaccardSimilarity(a: Set<string>, b: Set<string>): number {
    let intersection = 0;
    for (const item of a) {
      if (b.has(item)) intersection++;
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
