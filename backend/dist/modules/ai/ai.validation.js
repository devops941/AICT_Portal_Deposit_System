"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiManualCorrectionSchema = exports.aiCompareSchema = exports.aiSearchSchema = void 0;
const zod_1 = require("zod");
exports.aiSearchSchema = {
    body: zod_1.z.object({
        query: zod_1.z.string().min(2, 'Search query must be at least 2 characters long'),
        targetDomain: zod_1.z.enum(['FDRS', 'REQUIREMENTS', 'RELEASES', 'ALL']).optional(),
    }),
};
exports.aiCompareSchema = {
    body: zod_1.z.object({
        extractionId: zod_1.z.string().optional(),
        instrumentId: zod_1.z.string().optional(),
        formValues: zod_1.z
            .object({
            bankName: zod_1.z.string().optional(),
            fdrNumber: zod_1.z.string().optional(),
            holderName: zod_1.z.string().optional(),
            depositAmount: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
            issueDate: zod_1.z.string().optional(),
            maturityDate: zod_1.z.string().optional(),
            branchInformation: zod_1.z.string().optional(),
        })
            .optional(),
    }),
};
exports.aiManualCorrectionSchema = {
    body: zod_1.z.object({
        correctedFields: zod_1.z.object({
            bankName: zod_1.z.string().optional(),
            fdrNumber: zod_1.z.string().optional(),
            holderName: zod_1.z.string().optional(),
            depositAmount: zod_1.z.string().optional(),
            issueDate: zod_1.z.string().optional(),
            maturityDate: zod_1.z.string().optional(),
            branchInformation: zod_1.z.string().optional(),
        }),
        officerRemarks: zod_1.z.string().optional(),
        confirmExtraction: zod_1.z.boolean().optional(),
    }),
};
