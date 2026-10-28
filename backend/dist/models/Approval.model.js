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
exports.Approval = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ApprovalStepSchema = new mongoose_1.Schema({
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    roleRequired: { type: String, required: true },
    assignedApproverEmail: { type: String, trim: true },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED', 'SKIPPED'],
        default: 'PENDING',
    },
    actionBy: { type: String },
    actionByEmail: { type: String },
    actionDate: { type: Date },
    remarks: { type: String, trim: true },
}, { _id: false });
const ApprovalActionLogSchema = new mongoose_1.Schema({
    action: {
        type: String,
        enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED'],
        required: true,
    },
    stepNumber: { type: Number, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    remarks: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });
const ApprovalSchema = new mongoose_1.Schema({
    approvalId: {
        type: String,
        required: [true, 'Approval ID is required'],
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
    workflowType: {
        type: String,
        enum: ['FDR_REGISTRATION', 'FINANCIAL_RELEASE', 'CORRECTION_OVERRIDE'],
        default: 'FDR_REGISTRATION',
        index: true,
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
        index: true,
    },
    requestedByName: {
        type: String,
        required: true,
        trim: true,
    },
    amount: {
        type: mongoose_1.Schema.Types.Decimal128,
        required: true,
    },
    currentStep: {
        type: Number,
        default: 1,
    },
    totalSteps: {
        type: Number,
        default: 2,
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED'],
        default: 'PENDING',
        index: true,
    },
    steps: [ApprovalStepSchema],
    approvalHistory: [ApprovalActionLogSchema],
    isCompleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    completedAt: {
        type: Date,
    },
    finalDecision: {
        type: String,
        enum: ['APPROVED', 'REJECTED'],
    },
}, {
    timestamps: true,
    versionKey: false,
});
ApprovalSchema.index({ instrumentId: 1, status: 1 });
ApprovalSchema.index({ institutionId: 1, status: 1 });
ApprovalSchema.index({ currentStep: 1, status: 1 });
exports.Approval = mongoose_1.default.models.Approval || mongoose_1.default.model('Approval', ApprovalSchema);
