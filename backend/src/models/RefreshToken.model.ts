import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IRefreshToken extends Document {
  tokenHash: string;
  userType: 'ADMIN' | 'USER';
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenHash?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isActive(): boolean;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['ADMIN', 'USER'],
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL deletion
    },
    revokedAt: {
      type: Date,
    },
    replacedByTokenHash: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'refresh_tokens',
  }
);

RefreshTokenSchema.methods.isExpired = function (): boolean {
  return Date.now() >= this.expiresAt.getTime();
};

RefreshTokenSchema.methods.isActive = function (): boolean {
  return !this.revokedAt && !this.isExpired();
};

export const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema
);
