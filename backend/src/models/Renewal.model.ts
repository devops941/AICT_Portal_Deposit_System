import mongoose, { Document, Schema, Model } from 'mongoose';

export type RenewalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface IRenewalActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: Date;
}

export interface IReplacementDetails {
  instrumentType: string;
  bankName: string;
  bankBranch: string;
  fdrNumber: string;
  holderName: string;
  depositAmount: mongoose.Types.Decimal128;
  issueDate: Date;
  maturityDate: Date;
  documentReferences: string[];
  isJointAccount: boolean;
  autoRenewal: boolean;
  interestRate?: number;
  remarks?: string;
}

export interface IRenewal extends Document {
  renewalId: string;
  previousInstrumentId: string;
  replacementInstrumentId?: string;
  institutionId: string;
  institutionName: string;
  requirementId: string;
  requirementTitle?: string;
  status: RenewalStatus;
  renewalReason: string;
  originalAmount: mongoose.Types.Decimal128;
  originalMaturityDate: Date;
  originalFdrNumber: string;
  originalBankName: string;
  requestedBy: string;
  requestedByEmail: string;
  replacementDetails?: IReplacementDetails;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewRemarks?: string;
  history: IRenewalActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

const RenewalActivityLogSchema = new Schema<IRenewalActivityLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ReplacementDetailsSchema = new Schema<IReplacementDetails>(
  {
    instrumentType: { type: String, default: 'FDR' },
    bankName: { type: String, required: true, trim: true },
    bankBranch: { type: String, required: true, trim: true },
    fdrNumber: { type: String, required: true, trim: true },
    holderName: { type: String, required: true, trim: true },
    depositAmount: { type: Schema.Types.Decimal128, required: true },
    issueDate: { type: Date, required: true },
    maturityDate: { type: Date, required: true },
    documentReferences: { type: [String], default: [] },
    isJointAccount: { type: Boolean, default: true },
    autoRenewal: { type: Boolean, default: true },
    interestRate: { type: Number },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const RenewalSchema = new Schema<IRenewal>(
  {
    renewalId: {
      type: String,
      required: [true, 'Renewal ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    previousInstrumentId: {
      type: String,
      required: [true, 'Previous Instrument ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    replacementInstrumentId: {
      type: String,
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
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    renewalReason: {
      type: String,
      required: [true, 'Renewal reason is required'],
      trim: true,
    },
    originalAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },
    originalMaturityDate: {
      type: Date,
      required: true,
    },
    originalFdrNumber: {
      type: String,
      required: true,
      trim: true,
    },
    originalBankName: {
      type: String,
      required: true,
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
    replacementDetails: ReplacementDetailsSchema,
    reviewedBy: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    reviewRemarks: {
      type: String,
      trim: true,
    },
    history: [RenewalActivityLogSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

RenewalSchema.index({ previousInstrumentId: 1, status: 1 });
RenewalSchema.index({ replacementInstrumentId: 1 });
RenewalSchema.index({ institutionId: 1, status: 1 });

export const Renewal: Model<IRenewal> =
  mongoose.models.Renewal || mongoose.model<IRenewal>('Renewal', RenewalSchema);
