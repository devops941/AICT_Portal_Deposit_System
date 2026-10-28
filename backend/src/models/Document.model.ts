import mongoose, { Document, Schema, Model } from 'mongoose';

export type DocumentType =
  | 'FDR_RECEIPT'
  | 'BANK_CONFIRMATION_LETTER'
  | 'BOARD_RESOLUTION'
  | 'SFMS_ADVICE'
  | 'LIEN_ENDORSEMENT'
  | 'OTHER';

export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IDocumentRecord extends Document {
  documentId: string;
  instrumentId: string;
  institutionId: string;
  documentType: DocumentType;
  originalFileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  uploadedBy: string;
  uploadedByEmail: string;
  uploadedAt: Date;
  verificationStatus: DocumentVerificationStatus;
  remarks?: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRecordSchema = new Schema<IDocumentRecord>(
  {
    documentId: {
      type: String,
      required: [true, 'Document ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    instrumentId: {
      type: String,
      required: [true, 'Instrument ID reference is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    institutionId: {
      type: String,
      required: [true, 'Institution ID is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        'FDR_RECEIPT',
        'BANK_CONFIRMATION_LETTER',
        'BOARD_RESOLUTION',
        'SFMS_ADVICE',
        'LIEN_ENDORSEMENT',
        'OTHER',
      ],
      default: 'FDR_RECEIPT',
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    uploadedBy: {
      type: String,
      required: true,
    },
    uploadedByEmail: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    cloudinaryUrl: {
      type: String,
      trim: true,
    },
    cloudinaryPublicId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

DocumentRecordSchema.index({ instrumentId: 1, documentType: 1 });
DocumentRecordSchema.index({ institutionId: 1, uploadedAt: -1 });

export const DocumentRecord: Model<IDocumentRecord> =
  mongoose.models.DocumentRecord ||
  mongoose.model<IDocumentRecord>('DocumentRecord', DocumentRecordSchema);
