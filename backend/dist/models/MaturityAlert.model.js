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
exports.MaturityAlert = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MaturityAlertSchema = new mongoose_1.Schema({
    alertId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    instrumentId: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    institutionId: {
        type: String,
        required: true,
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
        uppercase: true,
        trim: true,
        index: true,
    },
    intervalDays: {
        type: Number,
        required: true,
        index: true,
    },
    maturityDate: {
        type: Date,
        required: true,
    },
    daysRemaining: {
        type: Number,
        required: true,
    },
    severity: {
        type: String,
        enum: ['INFO', 'WARNING', 'CRITICAL', 'URGENT'],
        default: 'WARNING',
    },
    alertMessage: {
        type: String,
        required: true,
        trim: true,
    },
    isResolved: {
        type: Boolean,
        default: false,
        index: true,
    },
    isEscalated: {
        type: Boolean,
        default: false,
    },
    sentToEmails: {
        type: [String],
        default: [],
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
MaturityAlertSchema.index({ instrumentId: 1, isResolved: 1 });
MaturityAlertSchema.index({ institutionId: 1, createdAt: -1 });
exports.MaturityAlert = mongoose_1.default.models.MaturityAlert || mongoose_1.default.model('MaturityAlert', MaturityAlertSchema);
