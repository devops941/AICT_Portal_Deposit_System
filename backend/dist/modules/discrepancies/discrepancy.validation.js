"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDiscrepancySchema = exports.createDiscrepancySchema = void 0;
const zod_1 = require("zod");
exports.createDiscrepancySchema = zod_1.z.object({
    instrumentId: zod_1.z.string().min(1, 'Instrument ID is required'),
    institutionId: zod_1.z.string().optional(),
    requirementId: zod_1.z.string().optional(),
    discrepancyType: zod_1.z.enum([
        'AMOUNT_MISMATCH',
        'DATE_INVALID',
        'NAME_MISMATCH',
        'DOCUMENT_ILLEGIBLE',
        'DUPLICATE_SUSPECT',
        'MISSING_DOCUMENT',
        'BANK_MISMATCH',
        'OTHER',
    ]),
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().min(5, 'Description must be at least 5 characters'),
    severity: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    assignedTo: zod_1.z.string().optional(),
});
exports.resolveDiscrepancySchema = zod_1.z.object({
    resolutionStatus: zod_1.z.enum(['RESOLVED', 'WAIVED']),
    resolutionRemarks: zod_1.z.string().min(3, 'Resolution remarks must be at least 3 characters'),
});
