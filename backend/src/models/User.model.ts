import mongoose, { Document, Schema, Model } from 'mongoose';
import { IRole } from './Role.model';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_ACTIVATION';

export interface IUser extends Document {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  institutionId?: string; // Optional for central AICTE officers, required for institution users
  roles: mongoose.Types.ObjectId[] | IRole[];
  status: UserStatus;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  lastLoginIp?: string;
  mustChangePassword?: boolean;
  createdAt: Date;
  updatedAt: Date;
  isLocked(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    institutionId: {
      type: String,
      trim: true,
      index: true, // Crucial for institution-level data isolation
    },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION'],
      default: 'PENDING_ACTIVATION',
      index: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'users', // Stored on separate 'users' table from 'admins'
  }
);

UserSchema.methods.isLocked = function (): boolean {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

// Compound index for fast tenant / institution filtering
UserSchema.index({ institutionId: 1, status: 1 });

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
