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
exports.Notification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const NotificationSchema = new mongoose_1.Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    userEmail: {
        type: String,
        trim: true,
    },
    institutionId: {
        type: String,
        trim: true,
        index: true,
    },
    type: {
        type: String,
        required: true,
        enum: [
            'MATURITY_ALERT',
            'VERIFICATION_UPDATE',
            'APPROVAL_REQUIRED',
            'RENEWAL_NOTICE',
            'RELEASE_DECISION',
            'DISCREPANCY_FLAG',
            'SYSTEM_ALERT',
        ],
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    templateId: {
        type: String,
        trim: true,
    },
    templateVariables: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    channel: {
        type: String,
        enum: ['IN_APP', 'EMAIL', 'BOTH'],
        default: 'BOTH',
    },
    status: {
        type: String,
        enum: ['PENDING', 'SENT', 'FAILED', 'READ'],
        default: 'SENT',
        index: true,
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    readAt: {
        type: Date,
    },
    deliveryAttempts: {
        type: Number,
        default: 1,
    },
    maxRetries: {
        type: Number,
        default: 3,
    },
    lastAttemptAt: {
        type: Date,
        default: Date.now,
    },
    errorMessage: {
        type: String,
    },
    actionUrl: {
        type: String,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, {
    timestamps: true,
    versionKey: false,
});
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ institutionId: 1, createdAt: -1 });
exports.Notification = mongoose_1.default.models.Notification ||
    mongoose_1.default.model('Notification', NotificationSchema);
