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
exports.Renewal = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RenewalActivityLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });
const ReplacementDetailsSchema = new mongoose_1.Schema({
    instrumentType: { type: String, default: 'FDR' },
    bankName: { type: String, required: true, trim: true },
    bankBranch: { type: String, required: true, trim: true },
    fdrNumber: { type: String, required: true, trim: true },
    holderName: { type: String, required: true, trim: true },
    depositAmount: { type: mongoose_1.Schema.Types.Decimal128, required: true },
    issueDate: { type: Date, required: true },
    maturityDate: { type: Date, required: true },
    documentReferences: { type: [String], default: [] },
    isJointAccount: { type: Boolean, default: true },
    autoRenewal: { type: Boolean, default: true },
    interestRate: { type: Number },
    remarks: { type: String, trim: true },
}, { _id: false });
const RenewalSchema = new mongoose_1.Schema({
    renewalId: {
        type: String,
        required: [true, 'Renewal ID is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    previousInstrumentId: {
        type: String,
        required: [true, 'Previous Instrument ID is required'],
        uppercase: true,
        trim: true,
        index: true,
    },
    replacementInstrumentId: {
        type: String,
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
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'],
        default: 'DRAFT',
        index: true,
    },
    renewalReason: {
        type: String,
        required: [true, 'Renewal reason is required'],
        trim: true,
    },
    originalAmount: {
        type: mongoose_1.Schema.Types.Decimal128,
        required: true,
    },
    originalMaturityDate: {
        type: Date,
        required: true,
    },
    originalFdrNumber: {
        type: String,
        required: true,
        trim: true,
    },
    originalBankName: {
        type: String,
        required: true,
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
    replacementDetails: ReplacementDetailsSchema,
    reviewedBy: {
        type: String,
        trim: true,
    },
    reviewedAt: {
        type: Date,
    },
    reviewRemarks: {
        type: String,
        trim: true,
    },
    history: [RenewalActivityLogSchema],
}, {
    timestamps: true,
    versionKey: false,
});
RenewalSchema.index({ previousInstrumentId: 1, status: 1 });
RenewalSchema.index({ replacementInstrumentId: 1 });
RenewalSchema.index({ institutionId: 1, status: 1 });
exports.Renewal = mongoose_1.default.models.Renewal || mongoose_1.default.model('Renewal', RenewalSchema);
