import mongoose, { Document, Schema, Model } from 'mongoose';

export type DiscrepancySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DiscrepancyResolutionStatus = 'OPEN' | 'RESOLVED' | 'WAIVED';
export type DiscrepancyType =
  | 'AMOUNT_MISMATCH'
  | 'DATE_INVALID'
  | 'NAME_MISMATCH'
  | 'DOCUMENT_ILLEGIBLE'
  | 'DUPLICATE_SUSPECT'
  | 'MISSING_DOCUMENT'
  | 'BANK_MISMATCH'
  | 'OTHER';

export interface IDiscrepancy extends Document {
  discrepancyId: string;
  instrumentId: string;
  institutionId: string;
  institutionName?: string;
  requirementId?: string;
  discrepancyType: DiscrepancyType;
  title: string;
  description: string;
  severity: DiscrepancySeverity;
  createdBy: string;
  createdByName?: string;
  assignedTo?: string;
  resolutionStatus: DiscrepancyResolutionStatus;
  resolutionRemarks?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiscrepancySchema = new Schema<IDiscrepancy>(
  {
    discrepancyId: {
      type: String,
      required: [true, 'Discrepancy ID is required'],
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
      trim: true,
    },
    requirementId: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    discrepancyType: {
      type: String,
      required: true,
      enum: [
        'AMOUNT_MISMATCH',
        'DATE_INVALID',
        'NAME_MISMATCH',
        'DOCUMENT_ILLEGIBLE',
        'DUPLICATE_SUSPECT',
        'MISSING_DOCUMENT',
        'BANK_MISMATCH',
        'OTHER',
      ],
      default: 'OTHER',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    createdByName: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    resolutionStatus: {
      type: String,
      enum: ['OPEN', 'RESOLVED', 'WAIVED'],
      default: 'OPEN',
      index: true,
    },
    resolutionRemarks: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
DiscrepancySchema.index({ instrumentId: 1, resolutionStatus: 1 });
DiscrepancySchema.index({ institutionId: 1, resolutionStatus: 1 });

export const Discrepancy: Model<IDiscrepancy> =
  mongoose.models.Discrepancy || mongoose.model<IDiscrepancy>('Discrepancy', DiscrepancySchema);
