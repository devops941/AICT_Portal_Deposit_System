"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveRenewalSchema = exports.submitRenewalSchema = exports.createRenewalSchema = void 0;
const zod_1 = require("zod");
const replacementDetailsSchema = zod_1.z.object({
    instrumentType: zod_1.z.string().default('FDR'),
    bankName: zod_1.z.string().min(1, 'Bank name is required'),
    bankBranch: zod_1.z.string().min(1, 'Bank branch is required'),
    fdrNumber: zod_1.z.string().min(1, 'FDR number is required'),
    holderName: zod_1.z.string().min(1, 'Holder name is required'),
    depositAmount: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Deposit amount must be a positive number',
    })
        .transform((val) => String(val)),
    issueDate: zod_1.z.coerce.date({
        required_error: 'Valid issue date is required',
    }),
    maturityDate: zod_1.z.coerce.date({
        required_error: 'Valid maturity date is required',
    }),
    documentReferences: zod_1.z.array(zod_1.z.string()).default([]),
    isJointAccount: zod_1.z.boolean().default(true),
    autoRenewal: zod_1.z.boolean().default(true),
    interestRate: zod_1.z.number().optional(),
    remarks: zod_1.z.string().optional(),
}).refine((data) => new Date(data.maturityDate).getTime() > new Date(data.issueDate).getTime(), {
    message: 'Maturity date must be after issue date',
    path: ['maturityDate'],
});
exports.createRenewalSchema = {
    body: zod_1.z.object({
        previousInstrumentId: zod_1.z.string().min(1, 'Previous Instrument ID is required'),
        renewalReason: zod_1.z.string().min(3, 'Renewal reason must be at least 3 characters'),
        replacementDetails: replacementDetailsSchema.optional(),
    }),
};
exports.submitRenewalSchema = {
    body: zod_1.z.object({
        replacementDetails: replacementDetailsSchema,
    }),
};
exports.approveRenewalSchema = {
    body: zod_1.z.object({
        remarks: zod_1.z.string().min(1, 'Approval remarks are required'),
    }),
};
