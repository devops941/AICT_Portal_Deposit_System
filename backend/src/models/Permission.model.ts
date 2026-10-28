import mongoose, { Document, Schema, Model } from 'mongoose';

export type PermissionAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'SUBMIT'
  | 'VERIFY'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT';

export interface IPermission extends Document {
  code: string; // e.g. "USERS:CREATE", "DEPOSITS:APPROVE"
  resource: string; // e.g. "USERS", "DEPOSITS", "FDR", "ROLES", "REPORTS", "AUDIT"
  action: PermissionAction;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'SUBMIT',
        'VERIFY',
        'APPROVE',
        'REJECT',
        'EXPORT',
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'permissions',
  }
);

export const Permission: Model<IPermission> = mongoose.model<IPermission>(
  'Permission',
  PermissionSchema
);
