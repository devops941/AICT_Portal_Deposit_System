import crypto from 'crypto';
import { AuthUserContext } from '../../middleware/auth.middleware';
import {
  AiExtraction,
  IAiExtraction,
  DocumentClassificationCategory,
} from '../../models/AiExtraction.model';
import { Fdr } from '../../models/Fdr.model';
import { DocumentRecord } from '../../models/Document.model';
import { ocrProvider } from './ocr.provider';
import { documentClassificationService } from './classification.service';
import { fieldExtractionService } from './extraction.service';
import { duplicateDetectionService } from './duplicate.service';
import { documentComparisonService, FormValuesToCompare } from './comparison.service';
import { aiSearchService } from './ai-search.service';
import {
  AiSearchResult,
  ComparisonResult,
  DocumentClassificationResult,
  ManualCorrectionInput,
} from './ocr.types';
import { AppError } from '../../utils/appError';
import { logger } from '../../config/logger';

export class AiService {
  /**
   * Complete Document Intelligence Extraction Pipeline
   */
  async extractDocumentIntelligence(params: {
    buffer: Buffer;
    mimeType: string;
    fileName: string;
    instrumentId?: string;
    documentId?: string;
    formValues?: FormValuesToCompare;
    user: AuthUserContext;
  }): Promise<IAiExtraction> {
    const { buffer, mimeType, fileName, instrumentId, documentId, formValues, user } = params;

    if (!buffer || buffer.length === 0) {
      throw AppError.badRequest('Invalid or empty document buffer provided');
    }

    // 1. Compute SHA-256 File Hash
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileSize = buffer.length;

    // 2. Perform OCR Text Extraction
    const ocrResult = await ocrProvider.extractText(buffer, mimeType, fileName);

    // 3. Document Classification
    const classification = documentClassificationService.classify(ocrResult.text, fileName);

    // 4. Statutory Field Extraction
    const extracted = fieldExtractionService.extractFields(ocrResult.text);

    // 5. Generate Extraction ID
    const extractionId = `EXT-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 900 + 100
    )}`;

    // 6. Duplicate Detection
    const duplicateFlag = await duplicateDetectionService.detectDuplicates({
      fileHash,
      fdrNumber: extracted.fdrNumber.value,
      bankName: extracted.bankName.value,
      rawText: ocrResult.text,
      currentExtractionId: extractionId,
      currentInstrumentId: instrumentId,
    });

    // Resolve institution from instrument if present
    let instId = user.institutionId || '';
    let fetchedFdr: any = null;
    if (instrumentId) {
      fetchedFdr = await Fdr.findOne({ fdrId: instrumentId.toUpperCase() }).lean();
      if (fetchedFdr) {
        instId = fetchedFdr.institutionId;
        // Tenant access check
        if (user.institutionId && user.institutionId !== fetchedFdr.institutionId) {
          throw AppError.forbidden('Access denied to process document for another institution FDR');
        }
      }
    }

    // 7. Form and OCR Comparison
    let comparisonData: any = undefined;
    const targetFormValues: FormValuesToCompare = formValues || (fetchedFdr ? {
      bankName: fetchedFdr.bankName,
      fdrNumber: fetchedFdr.fdrNumber,
      holderName: fetchedFdr.holderName,
      depositAmount: fetchedFdr.depositAmount ? fetchedFdr.depositAmount.toString() : undefined,
      issueDate: fetchedFdr.issueDate,
      maturityDate: fetchedFdr.maturityDate,
      branchInformation: fetchedFdr.bankBranch,
    } : {});

    if (Object.keys(targetFormValues).length > 0) {
      const compResult = await documentComparisonService.compareValues({
        formValues: targetFormValues,
        extractedValues: {
          bankName: extracted.bankName.value,
          fdrNumber: extracted.fdrNumber.value,
          holderName: extracted.holderName.value,
          depositAmount: extracted.depositAmount.value,
          issueDate: extracted.issueDate.value,
          maturityDate: extracted.maturityDate.value,
          branchInformation: extracted.branchInformation.value,
        },
        instrumentId,
        institutionId: instId,
        requirementId: fetchedFdr?.requirementId,
        createDiscrepancyOnMismatch: true,
        createdBy: user.id || (user as any).userId || 'SYSTEM',
        createdByName: user.email,
      });

      comparisonData = {
        hasMismatches: compResult.hasMismatches,
        mismatches: compResult.mismatches,
        discrepancyId: compResult.createdDiscrepancyId,
        checkedAt: new Date(),
      };
    }

    // 8. Create and Persist AI Extraction Record
    const extractionRecord = await AiExtraction.create({
      extractionId,
      documentId,
      instrumentId: instrumentId ? instrumentId.toUpperCase() : undefined,
      institutionId: instId ? instId.toUpperCase() : undefined,
      fileName,
      mimeType,
      fileHash,
      fileSize,
      rawText: ocrResult.text,
      documentClassification: {
        category: classification.category,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
      },
      extractedFields: {
        bankName: extracted.bankName,
        fdrNumber: extracted.fdrNumber,
        holderName: extracted.holderName,
        depositAmount: extracted.depositAmount,
        issueDate: extracted.issueDate,
        maturityDate: extracted.maturityDate,
        branchInformation: extracted.branchInformation,
      },
      overallConfidence: ocrResult.isUnreadable ? 0 : extracted.overallConfidence,
      duplicateRiskFlag: duplicateFlag,
      comparisonResult: comparisonData,
      officerConfirmed: false,
    });

    // If duplicate was suspected, flag the instrument if known
    if (duplicateFlag.isDuplicateSuspected && instrumentId) {
      await Fdr.updateOne(
        { fdrId: instrumentId.toUpperCase() },
        {
          $set: {
            isDuplicateFlagged: true,
            duplicateReviewNotes: duplicateFlag.details,
          },
        }
      );
    }

    logger.info(
      `AI Document Extraction complete: ${extractionId} for file "${fileName}". Overall confidence: ${extractionRecord.overallConfidence}%. Duplicate: ${duplicateFlag.isDuplicateSuspected}`
    );

    return extractionRecord;
  }

  /**
   * Classify Document Only
   */
  async classifyDocument(
    buffer: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<DocumentClassificationResult> {
    const ocrResult = await ocrProvider.extractText(buffer, mimeType, fileName);
    return documentClassificationService.classify(ocrResult.text, fileName);
  }

  /**
   * Compare Document extraction with Form Values
   */
  async compareDocument(params: {
    extractionId?: string;
    instrumentId?: string;
    formValues?: FormValuesToCompare;
    user: AuthUserContext;
  }): Promise<ComparisonResult> {
    const { extractionId, instrumentId, formValues, user } = params;

    let extraction: IAiExtraction | null = null;
    if (extractionId) {
      extraction = await AiExtraction.findOne({ extractionId: extractionId.toUpperCase() });
    } else if (instrumentId) {
      extraction = await AiExtraction.findOne({ instrumentId: instrumentId.toUpperCase() }).sort({
        createdAt: -1,
      });
    }

    if (!extraction) {
      throw AppError.notFound('No AI extraction record found to perform comparison against');
    }

    // Tenant check
    if (user.institutionId && extraction.institutionId && user.institutionId !== extraction.institutionId) {
      throw AppError.forbidden('Access denied to extraction of another institution');
    }

    let targetForm = formValues;
    if (!targetForm && extraction.instrumentId) {
      const fdr = await Fdr.findOne({ fdrId: extraction.instrumentId }).lean();
      if (fdr) {
        targetForm = {
          bankName: fdr.bankName,
          fdrNumber: fdr.fdrNumber,
          holderName: fdr.holderName,
          depositAmount: fdr.depositAmount ? fdr.depositAmount.toString() : undefined,
          issueDate: fdr.issueDate,
          maturityDate: fdr.maturityDate,
          branchInformation: fdr.bankBranch,
        };
      }
    }

    if (!targetForm) {
      throw AppError.badRequest('No form values supplied or associated instrument found');
    }

    const comparison = await documentComparisonService.compareValues({
      formValues: targetForm,
      extractedValues: {
        bankName: extraction.extractedFields.bankName.value,
        fdrNumber: extraction.extractedFields.fdrNumber.value,
        holderName: extraction.extractedFields.holderName.value,
        depositAmount: extraction.extractedFields.depositAmount.value,
        issueDate: extraction.extractedFields.issueDate.value,
        maturityDate: extraction.extractedFields.maturityDate.value,
        branchInformation: extraction.extractedFields.branchInformation.value,
      },
      instrumentId: extraction.instrumentId,
      institutionId: extraction.institutionId,
      createDiscrepancyOnMismatch: true,
      createdBy: user.id || (user as any).userId || 'SYSTEM',
      createdByName: user.email,
    });

    // Update extraction comparison result
    extraction.comparisonResult = {
      hasMismatches: comparison.hasMismatches,
      mismatches: comparison.mismatches,
      discrepancyId: comparison.createdDiscrepancyId,
      checkedAt: new Date(),
    };
    await extraction.save();

    return comparison;
  }

  /**
   * Get extraction by ID with tenant security
   */
  async getExtractionById(extractionId: string, user: AuthUserContext): Promise<IAiExtraction> {
    const extraction = await AiExtraction.findOne({
      $or: [
        { extractionId: extractionId.toUpperCase() },
        { documentId: extractionId.toUpperCase() },
      ],
    });

    if (!extraction) {
      throw AppError.notFound(`AI Extraction record ${extractionId} not found`);
    }

    if (user.institutionId && extraction.institutionId && user.institutionId !== extraction.institutionId) {
      throw AppError.forbidden('Access denied to view extraction of another institution');
    }

    return extraction;
  }

  /**
   * Manual Officer Field Correction & Confirmation
   */
  async manualCorrection(
    extractionId: string,
    input: ManualCorrectionInput,
    user: AuthUserContext
  ): Promise<IAiExtraction> {
    const extraction = await AiExtraction.findOne({ extractionId: extractionId.toUpperCase() });
    if (!extraction) {
      throw AppError.notFound(`Extraction ${extractionId} not found`);
    }

    if (user.institutionId && extraction.institutionId && user.institutionId !== extraction.institutionId) {
      throw AppError.forbidden('Access denied to update extraction of another institution');
    }

    // Apply corrected fields
    const updatedFields: Record<string, string> = {};
    for (const [key, val] of Object.entries(input.correctedFields)) {
      if (val !== undefined && (extraction.extractedFields as any)[key]) {
        (extraction.extractedFields as any)[key].value = val;
        (extraction.extractedFields as any)[key].isOverridden = true;
        (extraction.extractedFields as any)[key].confidence = 100; // Human officer verified
        updatedFields[key] = val;
      }
    }

    extraction.isManualCorrection = true;
    extraction.correctedFields = updatedFields as any;
    extraction.correctedBy = user.id || (user as any).userId;
    extraction.correctedAt = new Date();

    // If officer confirmation requested
    if (input.confirmExtraction) {
      extraction.officerConfirmed = true;
      extraction.officerConfirmedBy = user.id || (user as any).userId;
      extraction.officerConfirmedAt = new Date();
    }

    // Recompute overall confidence
    const fieldConfidences = Object.values(extraction.extractedFields).map((f) => f.confidence);
    extraction.overallConfidence = Math.round(
      fieldConfidences.reduce((acc, c) => acc + c, 0) / fieldConfidences.length
    );

    await extraction.save();
    logger.info(`Manual correction applied to AI Extraction ${extractionId} by ${user.email}`);

    return extraction;
  }

  /**
   * Retrieve Risk Flags (Duplicates and Severe Mismatches)
   */
  async getRiskFlags(user: AuthUserContext): Promise<any[]> {
    const filter: any = {
      $or: [
        { 'duplicateRiskFlag.isDuplicateSuspected': true },
        { 'comparisonResult.hasMismatches': true },
      ],
    };

    if (user.institutionId) {
      filter.institutionId = user.institutionId.toUpperCase();
    }

    const records = await AiExtraction.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return records.map((r) => ({
      extractionId: r.extractionId,
      documentId: r.documentId,
      instrumentId: r.instrumentId,
      institutionId: r.institutionId,
      fileName: r.fileName,
      classification: r.documentClassification?.category,
      duplicateRisk: r.duplicateRiskFlag,
      comparison: r.comparisonResult,
      overallConfidence: r.overallConfidence,
      officerConfirmed: r.officerConfirmed,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Natural Language AI Search
   */
  async search(query: string, user: AuthUserContext): Promise<AiSearchResult> {
    return aiSearchService.search(query, user);
  }
}

export const aiService = new AiService();
