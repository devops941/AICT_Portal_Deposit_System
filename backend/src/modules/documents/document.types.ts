import { DocumentType, DocumentVerificationStatus, IDocumentRecord } from '../../models/Document.model';

export { DocumentType, DocumentVerificationStatus, IDocumentRecord };

export interface DocumentUploadMetadata {
  documentId: string;
  instrumentId: string;
  institutionId: string;
  documentType: DocumentType;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileHash: string;
  uploadedBy: string;
  uploadedByEmail: string;
  uploadedAt: Date;
  verificationStatus: DocumentVerificationStatus;
}
