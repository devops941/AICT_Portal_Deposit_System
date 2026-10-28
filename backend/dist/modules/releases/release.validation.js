"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeReleaseSchema = exports.rejectReleaseSchema = exports.approveReleaseSchema = exports.clarificationResponseSchema = exports.reviewReleaseSchema = exports.createReleaseSchema = void 0;
const zod_1 = require("zod");
exports.createReleaseSchema = {
    body: zod_1.z.object({
        instrumentId: zod_1.z.string().trim().min(1, 'Instrument ID is required'),
        requestReason: zod_1.z.string().trim().min(5, 'Request reason must be at least 5 characters'),
        requestedAmount: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .optional()
            .refine((val) => val === undefined || (!isNaN(Number(val)) && Number(val) > 0), {
            message: 'Requested amount must be a positive number',
        })
            .transform((val) => (val !== undefined ? String(val) : undefined)),
        supportingDocuments: zod_1.z.array(zod_1.z.string().trim()).optional().default([]),
    }),
};
exports.reviewReleaseSchema = {
    body: zod_1.z.object({
        action: zod_1.z.enum(['UNDER_REVIEW', 'CLARIFICATION_REQUIRED']),
        clarificationQuery: zod_1.z.string().trim().optional(),
        decisionRemarks: zod_1.z.string().trim().optional(),
    }),
};
exports.clarificationResponseSchema = {
    body: zod_1.z.object({
        response: zod_1.z.string().trim().min(1, 'Response explanation is required'),
        supportingDocuments: zod_1.z.array(zod_1.z.string().trim()).optional().default([]),
    }),
};
exports.approveReleaseSchema = {
    body: zod_1.z.object({
        decisionRemarks: zod_1.z.string().trim().min(1, 'Decision remarks are required for approval'),
        approvalLevel: zod_1.z.number().int().min(1).max(2).optional(),
    }),
};
exports.rejectReleaseSchema = {
    body: zod_1.z.object({
        rejectionReason: zod_1.z.string().trim().min(1, 'Rejection reason is required'),
    }),
};
exports.closeReleaseSchema = {
    body: zod_1.z.object({
        closureRemarks: zod_1.z.string().trim().min(1, 'Closure remarks are required'),
        settlementReference: zod_1.z.string().trim().optional(),
    }),
};
