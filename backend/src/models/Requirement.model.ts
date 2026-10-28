import mongoose, { Document, Schema, Model } from 'mongoose';

export type RequirementType =
  | 'NEW_INSTITUTION_ESTABLISHMENT'
  | 'PROGRAM_EXPANSION'
  | 'ANNUAL_COMPLIANCE'
  | 'PENALTY_ESCROW'
  | 'ADDITIONAL_COURSE_INSPECTION'
  | 'LAND_DEFICIENCY_ESCROW';

export type InstrumentType = 'FDR' | 'BANK_GUARANTEE' | 'DEMAND_DRAFT' | 'GOVERNMENT_BOND';

export type RequirementStatus = 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED' | 'WAIVED';

export type ComplianceStatus =
  | 'NOT_SUBMITTED'
  | 'PARTIALLY_COMPLIANT'
  | 'COMPLIANT'
  | 'OVERDUE'
  | 'UNDER_REVIEW';

export interface IPledgedInstrument {
  id?: string;
  instrumentId: string;
  instrumentType: InstrumentType;
  bankName: string;
  branchName: string;
  amount: mongoose.Types.Decimal128;
  maturityDate: Date;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isJointAccount: boolean;
  pledgedAt: Date;
  remarks?: string;
}

export interface IRequirementActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: Date;
}

export interface IRequirement extends Document {
  requirementId: string;
  institutionId: string;
  institutionName: string;
  title: string;
  requirementType: RequirementType;
  requiredAmount: mongoose.Types.Decimal128;
  currency: string;
  effectiveDate: Date;
  submissionDeadline: Date;
  applicableRuleReference: string;
  acceptableInstrumentTypes: InstrumentType[];
  supportingDocumentRequirements: string[];
  applicableBusinessRules: string[];
  requirementStatus: RequirementStatus;
  complianceStatus: ComplianceStatus;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  pledgedInstruments: IPledgedInstrument[];
  activityHistory: IRequirementActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

const PledgedInstrumentSchema = new Schema<IPledgedInstrument>(
  {
    instrumentId: { type: String, required: true },
    instrumentType: {
      type: String,
      required: true,
      enum: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'],
    },
    bankName: { type: String, required: true },
    branchName: { type: String, required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
    maturityDate: { type: Date, required: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    isJointAccount: { type: Boolean, default: true },
    pledgedAt: { type: Date, default: Date.now },
    remarks: { type: String },
  },
  { _id: true }
);

const RequirementActivityLogSchema = new Schema<IRequirementActivityLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const RequirementSchema = new Schema<IRequirement>(
  {
    requirementId: {
      type: String,
      required: [true, 'Requirement ID is required'],
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
    title: {
      type: String,
      required: [true, 'Requirement title is required'],
      trim: true,
      maxlength: 250,
      index: true,
    },
    requirementType: {
      type: String,
      required: true,
      enum: [
        'NEW_INSTITUTION_ESTABLISHMENT',
        'PROGRAM_EXPANSION',
        'ANNUAL_COMPLIANCE',
        'PENALTY_ESCROW',
        'ADDITIONAL_COURSE_INSPECTION',
        'LAND_DEFICIENCY_ESCROW',
      ],
      default: 'NEW_INSTITUTION_ESTABLISHMENT',
      index: true,
    },
    requiredAmount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Required amount is required'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required'],
      default: Date.now,
    },
    submissionDeadline: {
      type: Date,
      required: [true, 'Submission deadline is required'],
      index: true,
    },
    applicableRuleReference: {
      type: String,
      required: [true, 'Rule reference is required'],
      trim: true,
    },
    acceptableInstrumentTypes: {
      type: [String],
      enum: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'],
      default: ['FDR'],
    },
    supportingDocumentRequirements: {
      type: [String],
      default: [],
    },
    applicableBusinessRules: {
      type: [String],
      default: [],
    },
    requirementStatus: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED', 'WAIVED'],
      default: 'ACTIVE',
      index: true,
    },
    complianceStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'PARTIALLY_COMPLIANT', 'COMPLIANT', 'OVERDUE', 'UNDER_REVIEW'],
      default: 'NOT_SUBMITTED',
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    pledgedInstruments: [PledgedInstrumentSchema],
    activityHistory: [RequirementActivityLogSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for high-throughput queries
RequirementSchema.index({ institutionId: 1, complianceStatus: 1 });
RequirementSchema.index({ requirementStatus: 1, submissionDeadline: 1 });
RequirementSchema.index({ requirementType: 1, complianceStatus: 1 });

export const Requirement: Model<IRequirement> =
  mongoose.models.Requirement || mongoose.model<IRequirement>('Requirement', RequirementSchema);
