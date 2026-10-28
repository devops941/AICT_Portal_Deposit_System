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
exports.Fdr = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const VerificationChecklistItemSchema = new mongoose_1.Schema({
    itemKey: { type: String, required: true },
    label: { type: String, required: true },
    status: {
        type: String,
        enum: ['PASS', 'FAIL', 'NOT_APPLICABLE', 'PENDING'],
        default: 'PENDING',
    },
    comments: { type: String, trim: true },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
}, { _id: false });
const ClarificationRecordSchema = new mongoose_1.Schema({
    query: { type: String, required: true },
    requestedBy: { type: String, required: true },
    requestedByEmail: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    response: { type: String, trim: true },
    respondedBy: { type: String },
    respondedAt: { type: Date },
}, { _id: true });
const FdrActivityLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });
const FdrSchema = new mongoose_1.Schema({
    fdrId: {
        type: String,
        required: [true, 'FDR ID is required'],
        unique: true,
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
    institutionName: {
        type: String,
        required: [true, 'Institution name is required'],
        trim: true,
    },
    requirementId: {
        type: String,
        required: [true, 'Requirement ID is required'],
        uppercase: true,
        trim: true,
        index: true,
    },
    requirementTitle: {
        type: String,
        trim: true,
    },
    instrumentType: {
        type: String,
        required: true,
        enum: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'],
        default: 'FDR',
        index: true,
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true,
        index: true,
    },
    bankBranch: {
        type: String,
        required: [true, 'Bank branch is required'],
        trim: true,
    },
    fdrNumber: {
        type: String,
        required: [true, 'FDR / Instrument certificate number is required'],
        trim: true,
        index: true,
    },
    holderName: {
        type: String,
        required: [true, 'Deposit holder name is required'],
        trim: true,
    },
    depositAmount: {
        type: mongoose_1.Schema.Types.Decimal128,
        required: [true, 'Deposit amount is required'],
    },
    issueDate: {
        type: Date,
        required: [true, 'Issue date is required'],
    },
    maturityDate: {
        type: Date,
        required: [true, 'Maturity date is required'],
        index: true,
    },
    currency: {
        type: String,
        default: 'INR',
        trim: true,
    },
    isJointAccount: {
        type: Boolean,
        default: true,
    },
    documentReferences: {
        type: [String],
        default: [],
    },
    submissionStatus: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'RETURNED_FOR_CORRECTION', 'APPROVED'],
        default: 'DRAFT',
        index: true,
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
        index: true,
    },
    lifecycleStatus: {
        type: String,
        enum: ['ACTIVE', 'MATURED', 'RELEASED', 'CLAIMED', 'CANCELLED'],
        default: 'ACTIVE',
        index: true,
    },
    isDuplicateFlagged: {
        type: Boolean,
        default: false,
        index: true,
    },
    duplicateReviewNotes: {
        type: String,
        trim: true,
    },
    autoRenewal: {
        type: Boolean,
        default: true,
    },
    interestRate: {
        type: Number,
    },
    remarks: {
        type: String,
        trim: true,
    },
    verificationRemarks: {
        type: String,
        trim: true,
    },
    verificationChecklist: [VerificationChecklistItemSchema],
    clarificationHistory: [ClarificationRecordSchema],
    approvalId: {
        type: String,
        trim: true,
        index: true,
    },
    previousInstrumentId: {
        type: String,
        trim: true,
        index: true,
    },
    replacementInstrumentId: {
        type: String,
        trim: true,
        index: true,
    },
    renewalRequestId: {
        type: String,
        trim: true,
        index: true,
    },
    releaseRequestId: {
        type: String,
        trim: true,
        index: true,
    },
    releasedAt: {
        type: Date,
    },
    releasedBy: {
        type: String,
        trim: true,
    },
    sentMaturityReminders: {
        type: [Number],
        default: [],
    },
    lastMaturityAlertSentAt: {
        type: Date,
    },
    createdBy: {
        type: String,
        required: true,
    },
    submittedAt: {
        type: Date,
    },
    verifiedAt: {
        type: Date,
    },
    verifiedBy: {
        type: String,
    },
    history: [FdrActivityLogSchema],
}, {
    timestamps: true,
    versionKey: false,
});
FdrSchema.index({ institutionId: 1, submissionStatus: 1 });
FdrSchema.index({ bankName: 1, fdrNumber: 1 });
FdrSchema.index({ requirementId: 1, verificationStatus: 1 });
FdrSchema.index({ isDuplicateFlagged: 1, submissionStatus: 1 });
exports.Fdr = mongoose_1.default.models.Fdr || mongoose_1.default.model('Fdr', FdrSchema);
