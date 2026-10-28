import {
  DocumentClassificationCategory,
  IExtractedField,
  IComparisonMismatch,
  IDuplicateRiskFlag,
  IAiExtraction,
} from '../../models/AiExtraction.model';

export {
  DocumentClassificationCategory,
  IExtractedField,
  IComparisonMismatch,
  IDuplicateRiskFlag,
  IAiExtraction,
};

export interface OcrExtractionResult {
  text: string;
  confidence: number;
  isUnreadable: boolean;
  metadata?: Record<string, any>;
}

export interface IOcrProvider {
  name: string;
  extractText(
    buffer: Buffer,
    mimeType: string,
    fileName?: string
  ): Promise<OcrExtractionResult>;
}

export interface DocumentClassificationResult {
  category: DocumentClassificationCategory;
  confidence: number;
  reasoning: string;
}

export interface ExtractedFdrFields {
  bankName: IExtractedField;
  fdrNumber: IExtractedField;
  holderName: IExtractedField;
  depositAmount: IExtractedField;
  issueDate: IExtractedField;
  maturityDate: IExtractedField;
  branchInformation: IExtractedField;
  overallConfidence: number;
}

export interface ComparisonInput {
  extractionId?: string;
  instrumentId?: string;
  formValues?: {
    bankName?: string;
    fdrNumber?: string;
    holderName?: string;
    depositAmount?: string;
    issueDate?: string;
    maturityDate?: string;
    branchInformation?: string;
  };
  createDiscrepancyOnMismatch?: boolean;
}

export interface ComparisonResult {
  hasMismatches: boolean;
  mismatches: IComparisonMismatch[];
  createdDiscrepancyId?: string;
  score: number;
}

export interface ManualCorrectionInput {
  correctedFields: {
    bankName?: string;
    fdrNumber?: string;
    holderName?: string;
    depositAmount?: string;
    issueDate?: string;
    maturityDate?: string;
    branchInformation?: string;
  };
  officerRemarks?: string;
  confirmExtraction?: boolean;
}

export interface AiSearchQueryInput {
  query: string;
  targetDomain?: 'FDRS' | 'REQUIREMENTS' | 'RELEASES' | 'ALL';
}

export interface AiSearchResult {
  query: string;
  interpretedIntent: string;
  filterApplied: Record<string, any>;
  domain: string;
  totalResults: number;
  results: any[];
}
