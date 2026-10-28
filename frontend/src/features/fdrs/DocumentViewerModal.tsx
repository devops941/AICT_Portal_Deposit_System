import React, { useState, useEffect } from 'react';
import { X, Download, FileText, CheckCircle2, ShieldCheck, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../services/apiClient';
import { DocumentItem } from './types';

interface DocumentViewerModalProps {
  isOpen: boolean;
  documentId: string | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  documentId,
  onClose,
}) => {
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocument();
    }
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, documentId]);

  const loadDocument = async () => {
    if (!documentId) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch Metadata
      const metaRes: any = await apiClient.get(`/v1/documents/${documentId}`);
      const fetchedDoc: DocumentItem = metaRes.data?.data || metaRes.data || metaRes;
      if (fetchedDoc) {
        setDoc(fetchedDoc);
      }

      // 2. Stream File Binary directly via authenticated API client
      const blobRes: any = await apiClient.get(`/v1/documents/${documentId}/preview`, {
        responseType: 'blob',
      });

      const blob = blobRes instanceof Blob
        ? blobRes
        : (blobRes?.data instanceof Blob ? blobRes.data : new Blob([blobRes], { type: fetchedDoc?.mimeType || 'application/pdf' }));

      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to load document preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentId || !doc) return;
    try {
      const blobRes: any = await apiClient.get(`/v1/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      const blob = blobRes instanceof Blob
        ? blobRes
        : (blobRes?.data instanceof Blob ? blobRes.data : new Blob([blobRes], { type: doc.mimeType || 'application/pdf' }));

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalFileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      alert(e.message || 'Failed to download document');
    }
  };

  if (!isOpen || !documentId) return null;

  const isPdf = doc?.mimeType === 'application/pdf';
  const isImage = doc?.mimeType?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                  {doc?.documentId || documentId}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {doc?.documentType}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                {doc?.originalFileName || 'Document Preview'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {doc?.cloudinaryUrl && (
              <a
                href={doc.cloudinaryUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Cloudinary</span>
              </a>
            )}
            <Button size="sm" variant="outline" onClick={handleDownload} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Viewport */}
        <div className="flex-1 bg-slate-900 overflow-hidden flex items-center justify-center relative">
          {isLoading ? (
            <div className="text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-xs">Decrypting and streaming document...</p>
            </div>
          ) : error ? (
            <div className="text-center p-6 max-w-md bg-rose-950/40 border border-rose-800 rounded-2xl text-rose-300 text-xs">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="font-bold">{error}</p>
              <p className="text-rose-400/80 mt-1">Please ensure you possess valid tenant authorization to access this record.</p>
            </div>
          ) : blobUrl ? (
            isPdf ? (
              <iframe
                src={blobUrl}
                title="Document Preview"
                className="w-full h-full border-none"
              />
            ) : isImage ? (
              <div className="p-4 max-h-full overflow-auto flex items-center justify-center">
                <img
                  src={blobUrl}
                  alt={doc?.originalFileName || 'Document'}
                  className="max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <div className="text-center text-slate-300">
                <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-bold">Preview not available for this MIME type</p>
                <p className="text-xs text-slate-400 mt-1">Click Download above to view the file locally.</p>
              </div>
            )
          ) : null}
        </div>

        {/* Footer Metadata */}
        <div className="px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 bg-white">
          <div className="flex items-center gap-4">
            <span>Size: {doc ? (doc.fileSize / 1024).toFixed(1) : 0} KB</span>
            <span className="font-mono text-[11px] text-slate-400">
              SHA-256: {doc?.fileHash?.substring(0, 16)}...
            </span>
          </div>
          <div>
            Uploaded by: <span className="font-semibold text-slate-700">{doc?.uploadedBy}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
