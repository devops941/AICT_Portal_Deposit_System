"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escalateStepSchema = exports.returnStepSchema = exports.rejectStepSchema = exports.approveStepSchema = exports.createApprovalSchema = void 0;
const zod_1 = require("zod");
exports.createApprovalSchema = zod_1.z.object({
    instrumentId: zod_1.z.string().min(1, 'Instrument ID is required'),
    workflowType: zod_1.z.enum(['FDR_REGISTRATION', 'FINANCIAL_RELEASE', 'CORRECTION_OVERRIDE']).optional(),
    configuredSteps: zod_1.z
        .array(zod_1.z.object({
        stepNumber: zod_1.z.number().int().positive(),
        title: zod_1.z.string().min(2),
        roleRequired: zod_1.z.string().min(2),
        assignedApproverEmail: zod_1.z.string().email().optional(),
    }))
        .optional(),
});
exports.approveStepSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(3, 'Approval remarks must be at least 3 characters'),
});
exports.rejectStepSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(3, 'Rejection remarks must be at least 3 characters'),
});
exports.returnStepSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(3, 'Clarification/Return remarks must be at least 3 characters'),
    returnToStep: zod_1.z.number().int().positive().optional(),
});
exports.escalateStepSchema = zod_1.z.object({
    remarks: zod_1.z.string().min(3, 'Escalation remarks must be at least 3 characters'),
    escalateToRole: zod_1.z.string().optional(),
    assignedApproverEmail: zod_1.z.string().email().optional(),
});
