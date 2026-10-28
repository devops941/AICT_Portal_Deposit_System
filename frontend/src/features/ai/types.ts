export type DocumentClassificationCategory =
  | 'FDR Certificate'
  | 'Renewal Certificate'
  | 'Bank Confirmation'
  | 'Release Authorization'
  | 'Supporting Document'
  | 'Unknown Document';

export interface IExtractedField<T = string> {
  value: T;
  confidence: number;
  rawSnippet?: string;
  isOverridden?: boolean;
}

export interface IComparisonMismatch {
  field: string;
  formValue: string;
  ocrValue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

export interface IDuplicateRiskFlag {
  isDuplicateSuspected: boolean;
  matchType?: 'HASH_EXACT' | 'NORMALIZED_FDR' | 'BANK_AND_REF' | 'HIGH_SIMILARITY';
  matchedInstrumentId?: string;
  matchedDocumentId?: string;
  similarityScore?: number;
  details?: string;
}

export interface IAiExtraction {
  _id?: string;
  extractionId: string;
  documentId?: string;
  instrumentId?: string;
  institutionId?: string;
  fileName: string;
  mimeType: string;
  fileHash: string;
  fileSize: number;
  rawText: string;
  documentClassification: {
    category: DocumentClassificationCategory;
    confidence: number;
    reasoning: string;
  };
  extractedFields: {
    bankName: IExtractedField;
    fdrNumber: IExtractedField;
    holderName: IExtractedField;
    depositAmount: IExtractedField;
    issueDate: IExtractedField;
    maturityDate: IExtractedField;
    branchInformation: IExtractedField;
  };
  overallConfidence: number;
  isManualCorrection: boolean;
  correctedFields?: Record<string, string>;
  correctedBy?: string;
  correctedAt?: string;
  comparisonResult?: {
    hasMismatches: boolean;
    mismatches: IComparisonMismatch[];
    discrepancyId?: string;
    checkedAt: string;
  };
  duplicateRiskFlag?: IDuplicateRiskFlag;
  officerConfirmed: boolean;
  officerConfirmedBy?: string;
  officerConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiSearchResult {
  query: string;
  interpretedIntent: string;
  filterApplied: Record<string, any>;
  domain: string;
  totalResults: number;
  results: any[];
}
