import mongoose, { Document, Schema, Model } from 'mongoose';

export type InstitutionType =
  | 'CENTRAL_UNIVERSITY'
  | 'STATE_UNIVERSITY'
  | 'GOVT_ENGINEERING_COLLEGE'
  | 'GOVT_AIDED_COLLEGE'
  | 'SELF_FINANCING_PRIVATE'
  | 'AUTONOMOUS_INSTITUTE'
  | 'DEEMED_TO_BE_UNIVERSITY'
  | 'OTHER';

export type RegistrationStatus = 'DRAFT' | 'SUBMITTED' | 'REGISTERED';
export type VerificationStatus = 'PENDING' | 'UNDER_SCRUTINY' | 'VERIFIED' | 'REJECTED';
export type InstitutionStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface IInstitutionDocument {
  id?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  remarks?: string;
}

export interface IActivityLog {
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: string;
  timestamp: Date;
}

export interface IInstitution extends Document {
  name: string;
  code: string;
  aicteId?: string;
  institutionType: InstitutionType;
  address: string;
  state: string;
  district: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  administratorId?: mongoose.Types.ObjectId;
  administratorName?: string;
  registrationStatus: RegistrationStatus;
  verificationStatus: VerificationStatus;
  status: InstitutionStatus;
  verificationRemarks?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  documents: IInstitutionDocument[];
  activityHistory: IActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionDocumentSchema = new Schema<IInstitutionDocument>(
  {
    documentType: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verifiedBy: { type: String },
    remarks: { type: String },
  },
  { _id: true }
);

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
      maxlength: 200,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Institution code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    aicteId: {
      type: String,
      trim: true,
      index: true,
    },
    institutionType: {
      type: String,
      required: [true, 'Institution type is required'],
      enum: [
        'CENTRAL_UNIVERSITY',
        'STATE_UNIVERSITY',
        'GOVT_ENGINEERING_COLLEGE',
        'GOVT_AIDED_COLLEGE',
        'SELF_FINANCING_PRIVATE',
        'AUTONOMOUS_INSTITUTE',
        'DEEMED_TO_BE_UNIVERSITY',
        'OTHER',
      ],
      default: 'SELF_FINANCING_PRIVATE',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
    },
    administratorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    administratorName: {
      type: String,
      trim: true,
    },
    registrationStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'REGISTERED'],
      default: 'REGISTERED',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    verificationRemarks: {
      type: String,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    documents: [InstitutionDocumentSchema],
    activityHistory: [ActivityLogSchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for searching and filtering
InstitutionSchema.index({ state: 1, district: 1 });
InstitutionSchema.index({ status: 1, verificationStatus: 1 });
InstitutionSchema.index({ institutionType: 1, status: 1 });

export const Institution: Model<IInstitution> =
  mongoose.models.Institution || mongoose.model<IInstitution>('Institution', InstitutionSchema);
