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
exports.DocumentRecord = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DocumentRecordSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    versionKey: false,
});
DocumentRecordSchema.index({ instrumentId: 1, documentType: 1 });
DocumentRecordSchema.index({ institutionId: 1, uploadedAt: -1 });
exports.DocumentRecord = mongoose_1.default.models.DocumentRecord ||
    mongoose_1.default.model('DocumentRecord', DocumentRecordSchema);
