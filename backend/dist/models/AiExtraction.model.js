"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiExtraction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExtractedFieldSchema = new mongoose_1.Schema({
    value: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    rawSnippet: { type: String },
    isOverridden: { type: Boolean, default: false },
}, { _id: false });
const ComparisonMismatchSchema = new mongoose_1.Schema({
    field: { type: String, required: true },
    formValue: { type: String, required: true },
    ocrValue: { type: String, required: true },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
    },
    description: { type: String, required: true },
}, { _id: false });
const DuplicateRiskFlagSchema = new mongoose_1.Schema({
    isDuplicateSuspected: { type: Boolean, default: false },
    matchType: {
        type: String,
        enum: ['HASH_EXACT', 'NORMALIZED_FDR', 'BANK_AND_REF', 'HIGH_SIMILARITY'],
    },
    matchedInstrumentId: { type: String },
    matchedDocumentId: { type: String },
    similarityScore: { type: Number },
    details: { type: String },
}, { _id: false });
const AiExtractionSchema = new mongoose_1.Schema({
    extractionId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    documentId: {
        type: String,
        trim: true,
        index: true,
    },
    instrumentId: {
        type: String,
        trim: true,
        index: true,
    },
    institutionId: {
        type: String,
        trim: true,
        index: true,
    },
    fileName: {
        type: String,
        required: true,
        trim: true,
    },
    mimeType: {
        type: String,
        required: true,
        trim: true,
    },
    fileHash: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    rawText: {
        type: String,
        default: '',
    },
    documentClassification: {
        category: {
            type: String,
            enum: [
                'FDR Certificate',
                'Renewal Certificate',
                'Bank Confirmation',
                'Release Authorization',
                'Supporting Document',
                'Unknown Document',
            ],
            default: 'FDR Certificate',
        },
        confidence: { type: Number, default: 0 },
        reasoning: { type: String, default: '' },
    },
    extractedFields: {
        bankName: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
        fdrNumber: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
        holderName: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
        depositAmount: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
        issueDate: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
        maturityDate: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
        branchInformation: { type: ExtractedFieldSchema, default: () => ({ value: '', confidence: 0 }) },
    },
    overallConfidence: {
        type: Number,
        default: 0,
    },
    isManualCorrection: {
        type: Boolean,
        default: false,
    },
    correctedFields: {
        type: Map,
        of: String,
    },
    correctedBy: {
        type: String,
    },
    correctedAt: {
        type: Date,
    },
    comparisonResult: {
        hasMismatches: { type: Boolean, default: false },
        mismatches: [ComparisonMismatchSchema],
        discrepancyId: { type: String },
        checkedAt: { type: Date },
    },
    duplicateRiskFlag: DuplicateRiskFlagSchema,
    officerConfirmed: {
        type: Boolean,
        default: false,
    },
    officerConfirmedBy: {
        type: String,
    },
    officerConfirmedAt: {
        type: Date,
    },
}, {
    timestamps: true,
    versionKey: false,
});
AiExtractionSchema.index({ instrumentId: 1, createdAt: -1 });
AiExtractionSchema.index({ documentId: 1 });
AiExtractionSchema.index({ fileHash: 1 });
exports.AiExtraction = mongoose_1.default.models.AiExtraction ||
    mongoose_1.default.model('AiExtraction', AiExtractionSchema);
