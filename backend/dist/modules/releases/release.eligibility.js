"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eligibilityAssessmentEngine = exports.EligibilityAssessmentEngine = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Fdr_model_1 = require("../../models/Fdr.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const Discrepancy_model_1 = require("../../models/Discrepancy.model");
const Release_model_1 = require("../../models/Release.model");
const decimal_1 = require("../../utils/decimal");
const appError_1 = require("../../utils/appError");
class EligibilityAssessmentEngine {
    async assessEligibility(instrumentId, requestedAmount, supportingDocuments = []) {
        const instrument = await Fdr_model_1.Fdr.findOne({
            $or: [
                { fdrId: instrumentId.toUpperCase().trim() },
                ...(mongoose_1.default.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
            ],
        });
        if (!instrument) {
            throw appError_1.AppError.notFound(`Instrument '${instrumentId}' not found`);
        }
        const requirement = await Requirement_model_1.Requirement.findOne({
            requirementId: instrument.requirementId.toUpperCase().trim(),
        });
        if (!requirement) {
            throw appError_1.AppError.notFound(`Linked deposit requirement '${instrument.requirementId}' not found`);
        }
        const checks = [];
        const blockingReasons = [];
        let scorePoints = 0;
        const maxScore = 100;
        const validLifecycle = ['ACTIVE', 'MATURED'].includes(instrument.lifecycleStatus);
        if (!validLifecycle) {
            checks.push({
                checkKey: 'INSTRUMENT_LIFECYCLE',
                label: 'Instrument Lifecycle Status',
                passed: false,
                severity: 'BLOCKER',
                message: `Instrument is in '${instrument.lifecycleStatus}' state. Only ACTIVE or MATURED instruments are eligible for release.`,
            });
            blockingReasons.push(`Instrument state is ${instrument.lifecycleStatus}`);
        }
        else {
            scorePoints += 20;
            checks.push({
                checkKey: 'INSTRUMENT_LIFECYCLE',
                label: 'Instrument Lifecycle Status',
                passed: true,
                severity: 'INFO',
                message: `Instrument is currently ${instrument.lifecycleStatus} and eligible for consideration.`,
            });
        }
        const existingActiveRelease = await Release_model_1.Release.findOne({
            instrumentId: instrument.fdrId,
            status: {
                $in: [
                    'SUBMITTED',
                    'UNDER_REVIEW',
                    'CLARIFICATION_REQUIRED',
                    'APPROVED',
                    'AUTHORIZED_RELEASE',
                ],
            },
        });
        if (existingActiveRelease) {
            checks.push({
                checkKey: 'DUPLICATE_RELEASE_CHECK',
                label: 'Previous / Active Release Requests',
                passed: false,
                severity: 'BLOCKER',
                message: `Active release request #${existingActiveRelease.releaseId} (${existingActiveRelease.status}) is already in progress for this instrument.`,
            });
            blockingReasons.push(`Active release request already exists (${existingActiveRelease.releaseId})`);
        }
        else {
            scorePoints += 15;
            checks.push({
                checkKey: 'DUPLICATE_RELEASE_CHECK',
                label: 'Previous / Active Release Requests',
                passed: true,
                severity: 'INFO',
                message: 'No conflicting active release requests on record for this instrument.',
            });
        }
        const openDiscrepancies = await Discrepancy_model_1.Discrepancy.find({
            instrumentId: instrument.fdrId,
            status: { $in: ['OPEN', 'INVESTIGATING'] },
        });
        if (openDiscrepancies.length > 0) {
            const highOrCritical = openDiscrepancies.filter((d) => d.severity === 'HIGH' || d.severity === 'CRITICAL');
            const isBlocker = highOrCritical.length > 0;
            checks.push({
                checkKey: 'DISCREPANCY_CLEARANCE',
                label: 'Discrepancy & Scrutiny Clearance',
                passed: !isBlocker,
                severity: isBlocker ? 'BLOCKER' : 'WARNING',
                message: `Found ${openDiscrepancies.length} open discrepancy records against this instrument (${highOrCritical.length} High/Critical).`,
                details: openDiscrepancies.map((d) => `[${d.discrepancyId}] ${d.title}`).join('; '),
            });
            if (isBlocker) {
                blockingReasons.push(`${highOrCritical.length} unresolved high-severity discrepancies`);
            }
        }
        else {
            scorePoints += 15;
            checks.push({
                checkKey: 'DISCREPANCY_CLEARANCE',
                label: 'Discrepancy & Scrutiny Clearance',
                passed: true,
                severity: 'INFO',
                message: 'No active discrepancies or scrutiny flags pending against this instrument.',
            });
        }
        const instrumentAmount = decimal_1.DecimalUtils.from(instrument.depositAmount);
        const requiredAmount = decimal_1.DecimalUtils.from(requirement.requiredAmount);
        const otherPledged = (requirement.pledgedInstruments || []).filter((p) => p.instrumentId !== instrument.fdrNumber &&
            p.instrumentId !== instrument.fdrId &&
            p.verificationStatus === 'VERIFIED');
        let otherVerifiedTotal = decimal_1.DecimalUtils.from(0);
        for (const p of otherPledged) {
            otherVerifiedTotal = decimal_1.DecimalUtils.add(otherVerifiedTotal, p.amount);
        }
        const requirementFulfilled = requirement.requirementStatus === 'FULFILLED' ||
            requirement.complianceStatus === 'COMPLIANT' ||
            otherVerifiedTotal.gte(requiredAmount);
        if (requirementFulfilled) {
            scorePoints += 25;
            checks.push({
                checkKey: 'COMPLIANCE_COVERAGE',
                label: 'Statutory Deposit Coverage',
                passed: true,
                severity: 'INFO',
                message: 'Requirement compliance satisfied. Remaining pledged capital or fulfilled status permits deposit discharge.',
            });
        }
        else {
            const now = new Date();
            const isMatured = new Date(instrument.maturityDate) <= now;
            checks.push({
                checkKey: 'COMPLIANCE_COVERAGE',
                label: 'Statutory Deposit Coverage',
                passed: false,
                severity: isMatured ? 'WARNING' : 'BLOCKER',
                message: isMatured
                    ? 'Instrument has matured, but deposit requirement is not yet fulfilled by replacement instruments. Release subject to statutory council sanction.'
                    : 'Underlying deposit requirement is active and unfulfilled. Release without statutory replacement would cause compliance shortfall.',
            });
            if (!isMatured) {
                blockingReasons.push('Underlying deposit requirement is not fulfilled');
            }
            else {
                scorePoints += 10;
            }
        }
        const issueDate = new Date(instrument.issueDate);
        const maturityDate = new Date(instrument.maturityDate);
        const totalTenureDays = Math.ceil((maturityDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
        const elapsedDays = Math.ceil((new Date().getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (elapsedDays >= totalTenureDays || totalTenureDays <= 0) {
            scorePoints += 15;
            checks.push({
                checkKey: 'TENURE_COMPLETION',
                label: 'Statutory Holding Tenure',
                passed: true,
                severity: 'INFO',
                message: `Maturity tenure of ${totalTenureDays} days has been reached or exceeded.`,
            });
        }
        else {
            scorePoints += 10;
            checks.push({
                checkKey: 'TENURE_COMPLETION',
                label: 'Statutory Holding Tenure',
                passed: true,
                severity: 'INFO',
                message: `Instrument is in ${elapsedDays}th day of ${totalTenureDays} days lock-in tenure. Early release assessment applied.`,
            });
        }
        const hasDocs = supportingDocuments && supportingDocuments.length > 0;
        if (hasDocs) {
            scorePoints += 10;
            checks.push({
                checkKey: 'DOCUMENTATION_COMPLETENESS',
                label: 'Statutory Supporting Documents',
                passed: true,
                severity: 'INFO',
                message: `${supportingDocuments.length} supporting clearance document(s) attached.`,
            });
        }
        else {
            checks.push({
                checkKey: 'DOCUMENTATION_COMPLETENESS',
                label: 'Statutory Supporting Documents',
                passed: false,
                severity: 'WARNING',
                message: 'No supporting clearance documents attached (e.g. No-Dues Certificate, Council Discharge Letter). Required before final authorization.',
            });
        }
        const isEligible = blockingReasons.length === 0;
        const eligibilityScore = Math.min(100, Math.max(0, scorePoints));
        const maturityTime = new Date(instrument.maturityDate).getTime();
        const daysRemaining = Math.ceil((maturityTime - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return {
            isEligible,
            eligibilityScore,
            checks,
            blockingReasons,
            instrumentSummary: {
                fdrId: instrument.fdrId,
                fdrNumber: instrument.fdrNumber,
                bankName: instrument.bankName,
                depositAmountFormatted: decimal_1.DecimalUtils.formatCurrency(instrument.depositAmount, instrument.currency),
                lifecycleStatus: instrument.lifecycleStatus,
                maturityDate: instrument.maturityDate.toISOString(),
                daysRemaining,
            },
            requirementSummary: {
                requirementId: requirement.requirementId,
                title: requirement.title,
                requiredAmountFormatted: decimal_1.DecimalUtils.formatCurrency(requirement.requiredAmount, requirement.currency),
                complianceStatus: requirement.complianceStatus,
            },
        };
    }
}
exports.EligibilityAssessmentEngine = EligibilityAssessmentEngine;
exports.eligibilityAssessmentEngine = new EligibilityAssessmentEngine();
