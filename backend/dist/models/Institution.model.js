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
exports.Institution = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InstitutionDocumentSchema = new mongoose_1.Schema({
    documentType: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
    },
    verifiedBy: { type: String },
    remarks: { type: String },
}, { _id: true });
const ActivityLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByEmail: { type: String, required: true },
    details: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: true });
const InstitutionSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Institution name is required'],
        trim: true,
        maxlength: 200,
        index: true,
    },
    code: {
        type: String,
        required: [true, 'Institution code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    aicteId: {
        type: String,
        trim: true,
        index: true,
    },
    institutionType: {
        type: String,
        required: [true, 'Institution type is required'],
        enum: [
            'CENTRAL_UNIVERSITY',
            'STATE_UNIVERSITY',
            'GOVT_ENGINEERING_COLLEGE',
            'GOVT_AIDED_COLLEGE',
            'SELF_FINANCING_PRIVATE',
            'AUTONOMOUS_INSTITUTE',
            'DEEMED_TO_BE_UNIVERSITY',
            'OTHER',
        ],
        default: 'SELF_FINANCING_PRIVATE',
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
        index: true,
    },
    district: {
        type: String,
        required: [true, 'District is required'],
        trim: true,
        index: true,
    },
    pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true,
    },
    contactEmail: {
        type: String,
        required: [true, 'Contact email is required'],
        lowercase: true,
        trim: true,
    },
    contactPhone: {
        type: String,
        required: [true, 'Contact phone is required'],
        trim: true,
    },
    administratorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    administratorName: {
        type: String,
        trim: true,
    },
    registrationStatus: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'REGISTERED'],
        default: 'REGISTERED',
        index: true,
    },
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'UNDER_SCRUTINY', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
        index: true,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE',
        index: true,
    },
    verificationRemarks: {
        type: String,
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: {
        type: Date,
    },
    documents: [InstitutionDocumentSchema],
    activityHistory: [ActivityLogSchema],
}, {
    timestamps: true,
    versionKey: false,
});
InstitutionSchema.index({ state: 1, district: 1 });
InstitutionSchema.index({ status: 1, verificationStatus: 1 });
InstitutionSchema.index({ institutionType: 1, status: 1 });
exports.Institution = mongoose_1.default.models.Institution || mongoose_1.default.model('Institution', InstitutionSchema);
