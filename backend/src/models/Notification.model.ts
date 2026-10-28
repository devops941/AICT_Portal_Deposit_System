import mongoose, { Document, Schema, Model } from 'mongoose';

export type NotificationType =
  | 'MATURITY_ALERT'
  | 'VERIFICATION_UPDATE'
  | 'APPROVAL_REQUIRED'
  | 'RENEWAL_NOTICE'
  | 'RELEASE_DECISION'
  | 'DISCREPANCY_FLAG'
  | 'SYSTEM_ALERT';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'BOTH';
export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export interface INotification extends Document {
  notificationId: string;
  userId: string;
  userEmail?: string;
  institutionId?: string;
  type: NotificationType;
  title: string;
  message: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  isRead: boolean;
  readAt?: Date;
  deliveryAttempts: number;
  maxRetries: number;
  lastAttemptAt?: Date;
  errorMessage?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    institutionId: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'MATURITY_ALERT',
        'VERIFICATION_UPDATE',
        'APPROVAL_REQUIRED',
        'RENEWAL_NOTICE',
        'RELEASE_DECISION',
        'DISCREPANCY_FLAG',
        'SYSTEM_ALERT',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    templateId: {
      type: String,
      trim: true,
    },
    templateVariables: {
      type: Schema.Types.Mixed,
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'BOTH'],
      default: 'BOTH',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
      default: 'SENT',
      index: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    deliveryAttempts: {
      type: Number,
      default: 1,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    errorMessage: {
      type: String,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ institutionId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
