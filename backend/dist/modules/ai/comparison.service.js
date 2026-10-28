"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentComparisonService = exports.DocumentComparisonService = void 0;
const Discrepancy_model_1 = require("../../models/Discrepancy.model");
const Fdr_model_1 = require("../../models/Fdr.model");
const logger_1 = require("../../config/logger");
class DocumentComparisonService {
    async compareValues(params) {
        const { formValues, extractedValues, instrumentId, institutionId, requirementId, createDiscrepancyOnMismatch = false, createdBy = 'SYSTEM_AI', createdByName = 'AI Document Intelligence', } = params;
        const mismatches = [];
        if (formValues.depositAmount !== undefined && extractedValues.depositAmount !== undefined) {
            const formAmt = this.parseNumericAmount(formValues.depositAmount);
            const ocrAmt = this.parseNumericAmount(extractedValues.depositAmount);
            if (formAmt !== null && ocrAmt !== null && formAmt > 0 && ocrAmt > 0) {
                const diff = Math.abs(formAmt - ocrAmt);
                if (diff > 1.0) {
                    mismatches.push({
                        field: 'depositAmount',
                        formValue: `₹${formAmt.toLocaleString('en-IN')}`,
                        ocrValue: `₹${ocrAmt.toLocaleString('en-IN')}`,
                        severity: 'CRITICAL',
                        description: `Potential Amount Mismatch: Form specifies ₹${formAmt.toLocaleString('en-IN')}, but OCR detected ₹${ocrAmt.toLocaleString('en-IN')} (Difference: ₹${diff.toLocaleString('en-IN')}).`,
                    });
                }
            }
        }
        if (formValues.fdrNumber && extractedValues.fdrNumber) {
            const normForm = this.normalizeAlphanumeric(formValues.fdrNumber);
            const normOcr = this.normalizeAlphanumeric(extractedValues.fdrNumber);
            if (normForm && normOcr && normForm !== normOcr) {
                mismatches.push({
                    field: 'fdrNumber',
                    formValue: formValues.fdrNumber,
                    ocrValue: extractedValues.fdrNumber,
                    severity: 'HIGH',
                    description: `FDR Number Mismatch: Form declared "${formValues.fdrNumber}", but certificate OCR extracted "${extractedValues.fdrNumber}".`,
                });
            }
        }
        if (formValues.issueDate && extractedValues.issueDate) {
            const formDateStr = this.normalizeDateString(formValues.issueDate);
            const ocrDateStr = this.normalizeDateString(extractedValues.issueDate);
            if (formDateStr && ocrDateStr && formDateStr !== ocrDateStr) {
                mismatches.push({
                    field: 'issueDate',
                    formValue: formDateStr,
                    ocrValue: ocrDateStr,
                    severity: 'MEDIUM',
                    description: `Issue Date Mismatch: Form declared ${formDateStr}, but document shows ${ocrDateStr}.`,
                });
            }
        }
        if (formValues.maturityDate && extractedValues.maturityDate) {
            const formMatStr = this.normalizeDateString(formValues.maturityDate);
            const ocrMatStr = this.normalizeDateString(extractedValues.maturityDate);
            if (formMatStr && ocrMatStr && formMatStr !== ocrMatStr) {
                mismatches.push({
                    field: 'maturityDate',
                    formValue: formMatStr,
                    ocrValue: ocrMatStr,
                    severity: 'MEDIUM',
                    description: `Maturity Date Mismatch: Form declared ${formMatStr}, but certificate shows ${ocrMatStr}.`,
                });
            }
        }
        if (formValues.bankName && extractedValues.bankName) {
            const normFormBank = this.normalizeAlphanumeric(formValues.bankName);
            const normOcrBank = this.normalizeAlphanumeric(extractedValues.bankName);
            if (normFormBank && normOcrBank && !normOcrBank.includes(normFormBank) && !normFormBank.includes(normOcrBank)) {
                mismatches.push({
                    field: 'bankName',
                    formValue: formValues.bankName,
                    ocrValue: extractedValues.bankName,
                    severity: 'MEDIUM',
                    description: `Bank Name Discrepancy: Form states "${formValues.bankName}", but OCR extracted "${extractedValues.bankName}".`,
                });
            }
        }
        if (formValues.holderName && extractedValues.holderName) {
            const normFormHolder = this.normalizeAlphanumeric(formValues.holderName);
            const normOcrHolder = this.normalizeAlphanumeric(extractedValues.holderName);
            if (normFormHolder &&
                normOcrHolder &&
                normFormHolder.length > 5 &&
                normOcrHolder.length > 5 &&
                !normOcrHolder.includes(normFormHolder) &&
                !normFormHolder.includes(normOcrHolder)) {
                mismatches.push({
                    field: 'holderName',
                    formValue: formValues.holderName,
                    ocrValue: extractedValues.holderName,
                    severity: 'LOW',
                    description: `Holder Name Variant: Form states "${formValues.holderName}", document shows "${extractedValues.holderName}".`,
                });
            }
        }
        let score = 100;
        for (const m of mismatches) {
            if (m.severity === 'CRITICAL')
                score -= 40;
            else if (m.severity === 'HIGH')
                score -= 25;
            else if (m.severity === 'MEDIUM')
                score -= 15;
            else
                score -= 5;
        }
        score = Math.max(0, score);
        let createdDiscrepancyId = undefined;
        if (createDiscrepancyOnMismatch && mismatches.length > 0 && instrumentId) {
            try {
                let instId = institutionId;
                let reqId = requirementId;
                let instName = 'Institution';
                if (!instId) {
                    const fdr = await Fdr_model_1.Fdr.findOne({ fdrId: instrumentId.toUpperCase() }).lean();
                    if (fdr) {
                        instId = fdr.institutionId;
                        reqId = fdr.requirementId;
                        instName = fdr.institutionName || 'Institution';
                    }
                }
                if (instId) {
                    const sorted = [...mismatches].sort((a, b) => {
                        const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
                        return (order[b.severity] || 0) - (order[a.severity] || 0);
                    });
                    const primary = sorted[0];
                    let discType = 'OTHER';
                    if (primary.field === 'depositAmount')
                        discType = 'AMOUNT_MISMATCH';
                    else if (primary.field === 'fdrNumber')
                        discType = 'OTHER';
                    else if (primary.field === 'issueDate' || primary.field === 'maturityDate')
                        discType = 'DATE_INVALID';
                    else if (primary.field === 'bankName')
                        discType = 'BANK_MISMATCH';
                    else if (primary.field === 'holderName')
                        discType = 'NAME_MISMATCH';
                    const discId = `DISC-AI-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
                    const disc = await Discrepancy_model_1.Discrepancy.create({
                        discrepancyId: discId,
                        instrumentId: instrumentId.toUpperCase(),
                        institutionId: instId.toUpperCase(),
                        institutionName: instName,
                        requirementId: reqId,
                        discrepancyType: discType,
                        title: `AI Discrepancy: ${primary.field} mismatch detected`,
                        description: mismatches.map((m) => `[${m.severity}] ${m.description}`).join(' | '),
                        severity: primary.severity,
                        createdBy,
                        createdByName,
                        resolutionStatus: 'OPEN',
                    });
                    createdDiscrepancyId = disc.discrepancyId;
                    logger_1.logger.info(`AI Auto-Discrepancy created: ${disc.discrepancyId} for FDR ${instrumentId}`);
                }
            }
            catch (err) {
                logger_1.logger.error(`Failed to auto-create discrepancy from AI comparison: ${err.message}`);
            }
        }
        return {
            hasMismatches: mismatches.length > 0,
            mismatches,
            createdDiscrepancyId,
            score,
        };
    }
    parseNumericAmount(val) {
        if (typeof val === 'number')
            return val;
        if (!val)
            return null;
        const str = val.toString().replace(/[^0-9\.]/g, '');
        const num = parseFloat(str);
        return isNaN(num) ? null : num;
    }
    normalizeAlphanumeric(val) {
        return val.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    }
    normalizeDateString(dateVal) {
        if (!dateVal)
            return null;
        if (dateVal instanceof Date) {
            return dateVal.toISOString().split('T')[0];
        }
        const str = dateVal.toString().trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str))
            return str;
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
        return str;
    }
}
exports.DocumentComparisonService = DocumentComparisonService;
exports.documentComparisonService = new DocumentComparisonService();
