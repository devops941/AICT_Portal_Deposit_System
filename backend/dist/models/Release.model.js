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
exports.Release = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EligibilityCheckResultSchema = new mongoose_1.Schema({
    checkKey: { type: String, required: true },
    label: { type: String, required: true },
    passed: { type: Boolean, required: true },
    severity: {
        type: String,
        enum: ['BLOCKER', 'WARNING', 'INFO'],
        default: 'INFO',
    },
    message: { type: String, required: true },
    details: { type: String },
}, { _id: false });
const ReleaseApprovalLevelSchema = new mongoose_1.Schema({
    levelNumber: { type: Number, required: true },
    title: { type: String, required: true },
    roleRequired: { type: String, required: true },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
    },
    actionBy: { type: String },
    actionByEmail: { type: String },
    actionDate: { type: Date },
    remarks: { type: String },
}, { _id: false });
const ReleaseActivityLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    role: { type: String },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });
const ReleaseSchema = new mongoose_1.Schema({
    releaseId: {
        type: String,
        required: [true, 'Release ID is required'],
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
        required: true,
        trim: true,
    },
    requirementId: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    requirementTitle: {
        type: String,
        trim: true,
    },
    instrumentId: {
        type: String,
        required: [true, 'Instrument ID is required'],
        uppercase: true,
        trim: true,
        index: true,
    },
    fdrNumber: {
        type: String,
        required: true,
        trim: true,
    },
    bankName: {
        type: String,
        required: true,
        trim: true,
    },
    requestedAmount: {
        type: mongoose_1.Schema.Types.Decimal128,
        required: [true, 'Requested amount is required'],
    },
    releasedAmount: {
        type: mongoose_1.Schema.Types.Decimal128,
    },
    requestReason: {
        type: String,
        required: [true, 'Request reason is required'],
        trim: true,
    },
    supportingDocuments: {
        type: [String],
        default: [],
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: [
            'SUBMITTED',
            'UNDER_REVIEW',
            'CLARIFICATION_REQUIRED',
            'APPROVED',
            'REJECTED',
            'AUTHORIZED_RELEASE',
            'CLOSED',
        ],
        default: 'SUBMITTED',
        index: true,
    },
    approvalStatus: {
        type: String,
        enum: ['PENDING', 'UNDER_SCRUTINY', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
        index: true,
    },
    isEligible: {
        type: Boolean,
        default: false,
    },
    eligibilityScore: {
        type: Number,
        default: 0,
    },
    eligibilityChecks: [EligibilityCheckResultSchema],
    blockingReasons: {
        type: [String],
        default: [],
    },
    currentLevel: {
        type: Number,
        default: 1,
    },
    totalLevels: {
        type: Number,
        default: 2,
    },
    approvalLevels: [ReleaseApprovalLevelSchema],
    decisionRemarks: {
        type: String,
        trim: true,
    },
    rejectionReason: {
        type: String,
        trim: true,
    },
    clarificationQuery: {
        type: String,
        trim: true,
    },
    clarificationResponse: {
        type: String,
        trim: true,
    },
    authorizedReleaseAt: {
        type: Date,
    },
    authorizedReleaseBy: {
        type: String,
        trim: true,
    },
    closedAt: {
        type: Date,
    },
    closedBy: {
        type: String,
        trim: true,
    },
    requestedBy: {
        type: String,
        required: true,
        trim: true,
    },
    requestedByEmail: {
        type: String,
        required: true,
        trim: true,
    },
    history: [ReleaseActivityLogSchema],
}, {
    timestamps: true,
    versionKey: false,
});
ReleaseSchema.index({ instrumentId: 1, status: 1 });
ReleaseSchema.index({ institutionId: 1, status: 1 });
ReleaseSchema.index({ requirementId: 1, status: 1 });
exports.Release = mongoose_1.default.models.Release || mongoose_1.default.model('Release', ReleaseSchema);
