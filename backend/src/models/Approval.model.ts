import mongoose, { Document, Schema, Model } from 'mongoose';

export type ApprovalWorkflowType = 'FDR_REGISTRATION' | 'FINANCIAL_RELEASE' | 'CORRECTION_OVERRIDE';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED';
export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED' | 'SKIPPED';

export interface IApprovalStep {
  stepNumber: number;
  title: string;
  roleRequired: string;
  assignedApproverEmail?: string;
  status: ApprovalStepStatus;
  actionBy?: string;
  actionByEmail?: string;
  actionDate?: Date;
  remarks?: string;
}

export interface IApprovalActionLog {
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'ESCALATED';
  stepNumber: number;
  performedBy: string;
  performedByEmail: string;
  remarks: string;
  timestamp: Date;
}

export interface IApproval extends Document {
  approvalId: string;
  instrumentId: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  workflowType: ApprovalWorkflowType;
  requestedBy: string;
  requestedByEmail: string;
  requestedByName: string;
  amount: mongoose.Types.Decimal128;
  currentStep: number;
  totalSteps: number;
  status: ApprovalStatus;
  steps: IApprovalStep[];
  approvalHistory: IApprovalActionLog[];
  isCompleted: boolean;
  completedAt?: Date;
  finalDecision?: 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalStepSchema = new Schema<IApprovalStep>(
  {
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    roleRequired: { type: String, required: true },
    assignedApproverEmail: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED', 'SKIPPED'],
      default: 'PENDING',
    },
    actionBy: { type: String },
    actionByEmail: { type: String },
    actionDate: { type: Date },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const ApprovalActionLogSchema = new Schema<IApprovalActionLog>(
  {
    action: {
      type: String,
      enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED'],
      required: true,
    },
    stepNumber: { type: Number, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    remarks: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ApprovalSchema = new Schema<IApproval>(
  {
    approvalId: {
      type: String,
      required: [true, 'Approval ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    instrumentId: {
      type: String,
      required: [true, 'Instrument ID is required'],
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
    workflowType: {
      type: String,
      enum: ['FDR_REGISTRATION', 'FINANCIAL_RELEASE', 'CORRECTION_OVERRIDE'],
      default: 'FDR_REGISTRATION',
      index: true,
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
      index: true,
    },
    requestedByName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    currentStep: {
      type: Number,
      default: 1,
    },
    totalSteps: {
      type: Number,
      default: 2,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED'],
      default: 'PENDING',
      index: true,
    },
    steps: [ApprovalStepSchema],
    approvalHistory: [ApprovalActionLogSchema],
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    finalDecision: {
      type: String,
      enum: ['APPROVED', 'REJECTED'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ApprovalSchema.index({ instrumentId: 1, status: 1 });
ApprovalSchema.index({ institutionId: 1, status: 1 });
ApprovalSchema.index({ currentStep: 1, status: 1 });

export const Approval: Model<IApproval> =
  mongoose.models.Approval || mongoose.model<IApproval>('Approval', ApprovalSchema);
