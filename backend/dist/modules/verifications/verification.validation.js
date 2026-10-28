"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestClarificationSchema = exports.rejectVerificationSchema = exports.verifyFdrSchema = void 0;
const zod_1 = require("zod");
exports.verifyFdrSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(3, 'Verification remarks must be at least 3 characters'),
    checklist: zod_1.z
        .array(zod_1.z.object({
        itemKey: zod_1.z.string(),
        label: zod_1.z.string().optional(),
        status: zod_1.z.enum(['PASS', 'FAIL', 'NOT_APPLICABLE', 'PENDING']),
        comments: zod_1.z.string().optional(),
    }))
        .optional(),
    initiateApprovalWorkflow: zod_1.z.boolean().optional(),
});
exports.rejectVerificationSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(5, 'Rejection remarks must be at least 5 characters detailing the non-compliance'),
});
exports.requestClarificationSchema = zod_1.z.object({
    query: zod_1.z.string().min(5, 'Clarification query must be at least 5 characters explaining what the institution must rectify'),
});
