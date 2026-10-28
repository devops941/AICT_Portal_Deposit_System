import mongoose, { Document, Schema, Model } from 'mongoose';
import { InstrumentType } from './Requirement.model';

export type FdrSubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'RETURNED_FOR_CORRECTION' | 'APPROVED';
export type FdrVerificationStatus = 'PENDING' | 'UNDER_SCRUTINY' | 'VERIFIED' | 'REJECTED';
export type FdrLifecycleStatus = 'ACTIVE' | 'MATURED' | 'RELEASED' | 'CLAIMED' | 'CANCELLED';

export interface IVerificationChecklistItem {
  itemKey: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'PENDING';
  comments?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface IClarificationRecord {
  query: string;
  requestedBy: string;
  requestedByEmail: string;
  requestedAt: Date;
  response?: string;
  respondedBy?: string;
  respondedAt?: Date;
}

export interface IFdrActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: Date;
}

export interface IFdr extends Document {
  fdrId: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  instrumentType: InstrumentType;
  bankName: string;
  bankBranch: string;
  fdrNumber: string;
  holderName: string;
  depositAmount: mongoose.Types.Decimal128;
  issueDate: Date;
  maturityDate: Date;
  currency: string;
  isJointAccount: boolean;
  documentReferences: string[];
  submissionStatus: FdrSubmissionStatus;
  verificationStatus: FdrVerificationStatus;
  lifecycleStatus: FdrLifecycleStatus;
  isDuplicateFlagged: boolean;
  duplicateReviewNotes?: string;
  autoRenewal: boolean;
  interestRate?: number;
  remarks?: string;
  verificationRemarks?: string;
  verificationChecklist?: IVerificationChecklistItem[];
  clarificationHistory?: IClarificationRecord[];
  approvalId?: string;
  previousInstrumentId?: string;
  replacementInstrumentId?: string;
  renewalRequestId?: string;
  releaseRequestId?: string;
  releasedAt?: Date;
  releasedBy?: string;
  sentMaturityReminders?: number[];
  lastMaturityAlertSentAt?: Date;
  createdBy: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  history: IFdrActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

const VerificationChecklistItemSchema = new Schema<IVerificationChecklistItem>(
  {
    itemKey: { type: String, required: true },
    label: { type: String, required: true },
    status: {
      type: String,
      enum: ['PASS', 'FAIL', 'NOT_APPLICABLE', 'PENDING'],
      default: 'PENDING',
    },
    comments: { type: String, trim: true },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
  },
  { _id: false }
);

const ClarificationRecordSchema = new Schema<IClarificationRecord>(
  {
    query: { type: String, required: true },
    requestedBy: { type: String, required: true },
    requestedByEmail: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    response: { type: String, trim: true },
    respondedBy: { type: String },
    respondedAt: { type: Date },
  },
  { _id: true }
);

const FdrActivityLogSchema = new Schema<IFdrActivityLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const FdrSchema = new Schema<IFdr>(
  {
    fdrId: {
      type: String,
      required: [true, 'FDR ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    institutionId: {
      type: String,
      required: [true, 'Institution ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    institutionName: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    requirementId: {
      type: String,
      required: [true, 'Requirement ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    requirementTitle: {
      type: String,
      trim: true,
    },
    instrumentType: {
      type: String,
      required: true,
      enum: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'],
      default: 'FDR',
      index: true,
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
      index: true,
    },
    bankBranch: {
      type: String,
      required: [true, 'Bank branch is required'],
      trim: true,
    },
    fdrNumber: {
      type: String,
      required: [true, 'FDR / Instrument certificate number is required'],
      trim: true,
      index: true,
    },
    holderName: {
      type: String,
      required: [true, 'Deposit holder name is required'],
      trim: true,
    },
    depositAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Deposit amount is required'],
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    maturityDate: {
      type: Date,
      required: [true, 'Maturity date is required'],
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    isJointAccount: {
      type: Boolean,
      default: true,
    },
    documentReferences: {
      type: [String],
      default: [],
    },
    submissionStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'RETURNED_FOR_CORRECTION', 'APPROVED'],
      default: 'DRAFT',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    lifecycleStatus: {
      type: String,
      enum: ['ACTIVE', 'MATURED', 'RELEASED', 'CLAIMED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    isDuplicateFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    duplicateReviewNotes: {
      type: String,
      trim: true,
    },
    autoRenewal: {
      type: Boolean,
      default: true,
    },
    interestRate: {
      type: Number,
    },
    remarks: {
      type: String,
      trim: true,
    },
    verificationRemarks: {
      type: String,
      trim: true,
    },
    verificationChecklist: [VerificationChecklistItemSchema],
    clarificationHistory: [ClarificationRecordSchema],
    approvalId: {
      type: String,
      trim: true,
      index: true,
    },
    previousInstrumentId: {
      type: String,
      trim: true,
      index: true,
    },
    replacementInstrumentId: {
      type: String,
      trim: true,
      index: true,
    },
    renewalRequestId: {
      type: String,
      trim: true,
      index: true,
    },
    releaseRequestId: {
      type: String,
      trim: true,
      index: true,
    },
    releasedAt: {
      type: Date,
    },
    releasedBy: {
      type: String,
      trim: true,
    },
    sentMaturityReminders: {
      type: [Number],
      default: [],
    },
    lastMaturityAlertSentAt: {
      type: Date,
    },
    createdBy: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedBy: {
      type: String,
    },
    history: [FdrActivityLogSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// High-performance compound indexes
FdrSchema.index({ institutionId: 1, submissionStatus: 1 });
FdrSchema.index({ bankName: 1, fdrNumber: 1 });
FdrSchema.index({ requirementId: 1, verificationStatus: 1 });
FdrSchema.index({ isDuplicateFlagged: 1, submissionStatus: 1 });

export const Fdr: Model<IFdr> =
  mongoose.models.Fdr || mongoose.model<IFdr>('Fdr', FdrSchema);
