import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPasswordResetToken extends Document {
  tokenHash: string;
  email: string;
  userType: 'ADMIN' | 'USER';
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isValid(): boolean;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userType: {
      type: String,
      enum: ['ADMIN', 'USER'],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically purged after expiry
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'password_reset_tokens',
  }
);

PasswordResetTokenSchema.methods.isValid = function (): boolean {
  return !this.usedAt && Date.now() < this.expiresAt.getTime();
};

export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
