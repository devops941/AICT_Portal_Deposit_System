import mongoose, { Document, Schema, Model } from 'mongoose';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'URGENT';

export interface IMaturityAlert extends Document {
  alertId: string;
  instrumentId: string;
  institutionId: string;
  institutionName: string;
  requirementId?: string;
  intervalDays: number;
  maturityDate: Date;
  daysRemaining: number;
  severity: AlertSeverity;
  alertMessage: string;
  isResolved: boolean;
  isEscalated: boolean;
  sentToEmails: string[];
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaturityAlertSchema = new Schema<IMaturityAlert>(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    instrumentId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    institutionId: {
      type: String,
      required: true,
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
      uppercase: true,
      trim: true,
      index: true,
    },
    intervalDays: {
      type: Number,
      required: true,
      index: true,
    },
    maturityDate: {
      type: Date,
      required: true,
    },
    daysRemaining: {
      type: Number,
      required: true,
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL', 'URGENT'],
      default: 'WARNING',
    },
    alertMessage: {
      type: String,
      required: true,
      trim: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    sentToEmails: {
      type: [String],
      default: [],
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

MaturityAlertSchema.index({ instrumentId: 1, isResolved: 1 });
MaturityAlertSchema.index({ institutionId: 1, createdAt: -1 });

export const MaturityAlert: Model<IMaturityAlert> =
  mongoose.models.MaturityAlert || mongoose.model<IMaturityAlert>('MaturityAlert', MaturityAlertSchema);
