import mongoose, { Document, Schema, Model } from 'mongoose';

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

export interface IAiExtraction extends Document {
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
  correctedAt?: Date;
  comparisonResult?: {
    hasMismatches: boolean;
    mismatches: IComparisonMismatch[];
    discrepancyId?: string;
    checkedAt: Date;
  };
  duplicateRiskFlag?: IDuplicateRiskFlag;
  officerConfirmed: boolean;
  officerConfirmedBy?: string;
  officerConfirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExtractedFieldSchema = new Schema(
  {
    value: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    rawSnippet: { type: String },
    isOverridden: { type: Boolean, default: false },
  },
  { _id: false }
);

const ComparisonMismatchSchema = new Schema(
  {
    field: { type: String, required: true },
    formValue: { type: String, required: true },
    ocrValue: { type: String, required: true },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    description: { type: String, required: true },
  },
  { _id: false }
);

const DuplicateRiskFlagSchema = new Schema(
  {
    isDuplicateSuspected: { type: Boolean, default: false },
    matchType: {
      type: String,
      enum: ['HASH_EXACT', 'NORMALIZED_FDR', 'BANK_AND_REF', 'HIGH_SIMILARITY'],
    },
    matchedInstrumentId: { type: String },
    matchedDocumentId: { type: String },
    similarityScore: { type: Number },
    details: { type: String },
  },
  { _id: false }
);

const AiExtractionSchema = new Schema<IAiExtraction>(
  {
    extractionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    documentId: {
      type: String,
      trim: true,
      index: true,
    },
    instrumentId: {
      type: String,
      trim: true,
      index: true,
    },
    institutionId: {
      type: String,
      trim: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileHash: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    rawText: {
      type: String,
      default: '',
    },
    documentClassification: {
      category: {
        type: String,
        enum: [
          'FDR Certificate',
          'Renewal Certificate',
          'Bank Confirmation',
          'Release Authorization',
          'Supporting Document',
          'Unknown Document',
        ],
        default: 'FDR Certificate',
      },
      confidence: { type: Number, default: 0 },
      reasoning: { type: String, default: '' },
    },
    extractedFields: {
      bankName: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
      fdrNumber: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
      holderName: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
      depositAmount: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
      issueDate: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
      maturityDate: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
      branchInformation: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
    },
    overallConfidence: {
      type: Number,
      default: 0,
    },
    isManualCorrection: {
      type: Boolean,
      default: false,
    },
    correctedFields: {
      type: Map,
      of: String,
    },
    correctedBy: {
      type: String,
    },
    correctedAt: {
      type: Date,
    },
    comparisonResult: {
      hasMismatches: { type: Boolean, default: false },
      mismatches: [ComparisonMismatchSchema],
      discrepancyId: { type: String },
      checkedAt: { type: Date },
    },
    duplicateRiskFlag: DuplicateRiskFlagSchema,
    officerConfirmed: {
      type: Boolean,
      default: false,
    },
    officerConfirmedBy: {
      type: String,
    },
    officerConfirmedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AiExtractionSchema.index({ instrumentId: 1, createdAt: -1 });
AiExtractionSchema.index({ documentId: 1 });
AiExtractionSchema.index({ fileHash: 1 });

export const AiExtraction: Model<IAiExtraction> =
  mongoose.models.AiExtraction ||
  mongoose.model<IAiExtraction>('AiExtraction', AiExtractionSchema);
