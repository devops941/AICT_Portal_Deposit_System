import mongoose, { Document, Schema, Model } from 'mongoose';
import { IPermission } from './Permission.model';

export type SystemRoleName =
  | 'SYSTEM_ADMINISTRATOR'
  | 'INSTITUTION_ADMIN'
  | 'INSTITUTION_STAFF'
  | 'VERIFICATION_OFFICER'
  | 'SENIOR_VERIFICATION_OFFICER'
  | 'APPROVING_AUTHORITY'
  | 'AUDITOR';

export interface IRole extends Document {
  name: string; // Machine-readable key, e.g. "INSTITUTION_ADMIN"
  displayName: string; // Human-readable, e.g. "Institution Admin"
  description: string;
  permissions: mongoose.Types.ObjectId[] | IPermission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'roles',
  }
);

export const Role: Model<IRole> = mongoose.model<IRole>('Role', RoleSchema);
