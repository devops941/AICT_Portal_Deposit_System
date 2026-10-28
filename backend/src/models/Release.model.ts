import mongoose, { Document, Schema, Model } from 'mongoose';

export type ReleaseStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTHORIZED_RELEASE'
  | 'CLOSED';

export type ReleaseApprovalStatus = 'PENDING' | 'UNDER_SCRUTINY' | 'APPROVED' | 'REJECTED';

export interface IEligibilityCheckResult {
  checkKey: string;
  label: string;
  passed: boolean;
  severity: 'BLOCKER' | 'WARNING' | 'INFO';
  message: string;
  details?: string;
}

export interface IReleaseActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  role?: string;
  details: string;
  timestamp: Date;
}

export interface IReleaseApprovalLevel {
  levelNumber: number;
  title: string;
  roleRequired: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionBy?: string;
  actionByEmail?: string;
  actionDate?: Date;
  remarks?: string;
}

export interface IRelease extends Document {
  releaseId: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  instrumentId: string;
  fdrNumber: string;
  bankName: string;
  requestedAmount: mongoose.Types.Decimal128;
  releasedAmount?: mongoose.Types.Decimal128;
  requestReason: string;
  supportingDocuments: string[];
  requestDate: Date;
  status: ReleaseStatus;
  approvalStatus: ReleaseApprovalStatus;
  isEligible: boolean;
  eligibilityScore: number;
  eligibilityChecks: IEligibilityCheckResult[];
  blockingReasons: string[];
  currentLevel: number;
  totalLevels: number;
  approvalLevels: IReleaseApprovalLevel[];
  decisionRemarks?: string;
  rejectionReason?: string;
  clarificationQuery?: string;
  clarificationResponse?: string;
  authorizedReleaseAt?: Date;
  authorizedReleaseBy?: string;
  closedAt?: Date;
  closedBy?: string;
  requestedBy: string;
  requestedByEmail: string;
  history: IReleaseActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

const EligibilityCheckResultSchema = new Schema<IEligibilityCheckResult>(
  {
    checkKey: { type: String, required: true },
    label: { type: String, required: true },
    passed: { type: Boolean, required: true },
    severity: {
      type: String,
      enum: ['BLOCKER', 'WARNING', 'INFO'],
      default: 'INFO',
    },
    message: { type: String, required: true },
    details: { type: String },
  },
  { _id: false }
);

const ReleaseApprovalLevelSchema = new Schema<IReleaseApprovalLevel>(
  {
    levelNumber: { type: Number, required: true },
    title: { type: String, required: true },
    roleRequired: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    actionBy: { type: String },
    actionByEmail: { type: String },
    actionDate: { type: Date },
    remarks: { type: String },
  },
  { _id: false }
);

const ReleaseActivityLogSchema = new Schema<IReleaseActivityLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    role: { type: String },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ReleaseSchema = new Schema<IRelease>(
  {
    releaseId: {
      type: String,
      required: [true, 'Release ID is required'],
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
      required: true,
      trim: true,
    },
    requirementId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    requirementTitle: {
      type: String,
      trim: true,
    },
    instrumentId: {
      type: String,
      required: [true, 'Instrument ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    fdrNumber: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    requestedAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Requested amount is required'],
    },
    releasedAmount: {
      type: Schema.Types.Decimal128,
    },
    requestReason: {
      type: String,
      required: [true, 'Request reason is required'],
      trim: true,
    },
    supportingDocuments: {
      type: [String],
      default: [],
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'CLARIFICATION_REQUIRED',
        'APPROVED',
        'REJECTED',
        'AUTHORIZED_RELEASE',
        'CLOSED',
      ],
      default: 'SUBMITTED',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_SCRUTINY', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    isEligible: {
      type: Boolean,
      default: false,
    },
    eligibilityScore: {
      type: Number,
      default: 0,
    },
    eligibilityChecks: [EligibilityCheckResultSchema],
    blockingReasons: {
      type: [String],
      default: [],
    },
    currentLevel: {
      type: Number,
      default: 1,
    },
    totalLevels: {
      type: Number,
      default: 2,
    },
    approvalLevels: [ReleaseApprovalLevelSchema],
    decisionRemarks: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    clarificationQuery: {
      type: String,
      trim: true,
    },
    clarificationResponse: {
      type: String,
      trim: true,
    },
    authorizedReleaseAt: {
      type: Date,
    },
    authorizedReleaseBy: {
      type: String,
      trim: true,
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: String,
      trim: true,
    },
    requestedBy: {
      type: String,
      required: true,
      trim: true,
    },
    requestedByEmail: {
      type: String,
      required: true,
      trim: true,
    },
    history: [ReleaseActivityLogSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ReleaseSchema.index({ instrumentId: 1, status: 1 });
ReleaseSchema.index({ institutionId: 1, status: 1 });
ReleaseSchema.index({ requirementId: 1, status: 1 });

export const Release: Model<IRelease> =
  mongoose.models.Release || mongoose.model<IRelease>('Release', ReleaseSchema);
