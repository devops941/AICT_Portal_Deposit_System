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
exports.Requirement = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PledgedInstrumentSchema = new mongoose_1.Schema({
    instrumentId: { type: String, required: true },
    instrumentType: {
        type: String,
        required: true,
        enum: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'],
    },
    bankName: { type: String, required: true },
    branchName: { type: String, required: true },
    amount: { type: mongoose_1.Schema.Types.Decimal128, required: true },
    maturityDate: { type: Date, required: true },
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
    },
    isJointAccount: { type: Boolean, default: true },
    pledgedAt: { type: Date, default: Date.now },
    remarks: { type: String },
}, { _id: true });
const RequirementActivityLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });
const RequirementSchema = new mongoose_1.Schema({
    requirementId: {
        type: String,
        required: [true, 'Requirement ID is required'],
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
    title: {
        type: String,
        required: [true, 'Requirement title is required'],
        trim: true,
        maxlength: 250,
        index: true,
    },
    requirementType: {
        type: String,
        required: true,
        enum: [
            'NEW_INSTITUTION_ESTABLISHMENT',
            'PROGRAM_EXPANSION',
            'ANNUAL_COMPLIANCE',
            'PENALTY_ESCROW',
            'ADDITIONAL_COURSE_INSPECTION',
            'LAND_DEFICIENCY_ESCROW',
        ],
        default: 'NEW_INSTITUTION_ESTABLISHMENT',
        index: true,
    },
    requiredAmount: {
        type: mongoose_1.Schema.Types.Decimal128,
        required: [true, 'Required amount is required'],
    },
    currency: {
        type: String,
        default: 'INR',
        trim: true,
    },
    effectiveDate: {
        type: Date,
        required: [true, 'Effective date is required'],
        default: Date.now,
    },
    submissionDeadline: {
        type: Date,
        required: [true, 'Submission deadline is required'],
        index: true,
    },
    applicableRuleReference: {
        type: String,
        required: [true, 'Rule reference is required'],
        trim: true,
    },
    acceptableInstrumentTypes: {
        type: [String],
        enum: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'],
        default: ['FDR'],
    },
    supportingDocumentRequirements: {
        type: [String],
        default: [],
    },
    applicableBusinessRules: {
        type: [String],
        default: [],
    },
    requirementStatus: {
        type: String,
        enum: ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED', 'WAIVED'],
        default: 'ACTIVE',
        index: true,
    },
    complianceStatus: {
        type: String,
        enum: ['NOT_SUBMITTED', 'PARTIALLY_COMPLIANT', 'COMPLIANT', 'OVERDUE', 'UNDER_REVIEW'],
        default: 'NOT_SUBMITTED',
        index: true,
    },
    createdBy: {
        type: String,
        required: true,
    },
    approvedBy: {
        type: String,
    },
    approvedAt: {
        type: Date,
    },
    pledgedInstruments: [PledgedInstrumentSchema],
    activityHistory: [RequirementActivityLogSchema],
}, {
    timestamps: true,
    versionKey: false,
});
RequirementSchema.index({ institutionId: 1, complianceStatus: 1 });
RequirementSchema.index({ requirementStatus: 1, submissionDeadline: 1 });
RequirementSchema.index({ requirementType: 1, complianceStatus: 1 });
exports.Requirement = mongoose_1.default.models.Requirement || mongoose_1.default.model('Requirement', RequirementSchema);
