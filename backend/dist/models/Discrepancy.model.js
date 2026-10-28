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
exports.Discrepancy = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DiscrepancySchema = new mongoose_1.Schema({
    discrepancyId: {
        type: String,
        required: [true, 'Discrepancy ID is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    instrumentId: {
        type: String,
        required: [true, 'Instrument ID is required'],
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
    institutionName: {
        type: String,
        trim: true,
    },
    requirementId: {
        type: String,
        uppercase: true,
        trim: true,
        index: true,
    },
    discrepancyType: {
        type: String,
        required: true,
        enum: [
            'AMOUNT_MISMATCH',
            'DATE_INVALID',
            'NAME_MISMATCH',
            'DOCUMENT_ILLEGIBLE',
            'DUPLICATE_SUSPECT',
            'MISSING_DOCUMENT',
            'BANK_MISMATCH',
            'OTHER',
        ],
        default: 'OTHER',
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
        index: true,
    },
    createdBy: {
        type: String,
        required: true,
        trim: true,
    },
    createdByName: {
        type: String,
        trim: true,
    },
    assignedTo: {
        type: String,
        trim: true,
    },
    resolutionStatus: {
        type: String,
        enum: ['OPEN', 'RESOLVED', 'WAIVED'],
        default: 'OPEN',
        index: true,
    },
    resolutionRemarks: {
        type: String,
        trim: true,
    },
    resolvedAt: {
        type: Date,
    },
    resolvedBy: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
DiscrepancySchema.index({ instrumentId: 1, resolutionStatus: 1 });
DiscrepancySchema.index({ institutionId: 1, resolutionStatus: 1 });
exports.Discrepancy = mongoose_1.default.models.Discrepancy || mongoose_1.default.model('Discrepancy', DiscrepancySchema);
