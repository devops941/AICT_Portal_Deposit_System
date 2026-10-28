import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAdmin extends Document {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
  isLocked(): boolean;
}

const AdminSchema = new Schema<IAdmin>(
  {
    fullName: {
      type: String,
      required: [true, 'Admin full name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return password hash in queries by default
    },
    role: {
      type: String,
      default: 'SYSTEM_ADMINISTRATOR',
      enum: ['SYSTEM_ADMINISTRATOR'],
    },
    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
    collection: 'admins', // Separate collection for Super Admin as required
  }
);

AdminSchema.methods.isLocked = function (): boolean {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

export const Admin: Model<IAdmin> = mongoose.model<IAdmin>('Admin', AdminSchema);
