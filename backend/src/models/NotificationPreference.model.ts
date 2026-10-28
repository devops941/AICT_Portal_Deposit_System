import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INotificationPreference extends Document {
  userId: string;
  email: boolean;
  inApp: boolean;
  maturityAlerts: boolean;
  verificationAlerts: boolean;
  approvalAlerts: boolean;
  renewalAlerts: boolean;
  releaseAlerts: boolean;
  discrepancyAlerts: boolean;
  systemAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    maturityAlerts: { type: Boolean, default: true },
    verificationAlerts: { type: Boolean, default: true },
    approvalAlerts: { type: Boolean, default: true },
    renewalAlerts: { type: Boolean, default: true },
    releaseAlerts: { type: Boolean, default: true },
    discrepancyAlerts: { type: Boolean, default: true },
    systemAlerts: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const NotificationPreference: Model<INotificationPreference> =
  mongoose.models.NotificationPreference ||
  mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);
