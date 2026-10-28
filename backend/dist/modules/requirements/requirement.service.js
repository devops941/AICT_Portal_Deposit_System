"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementService = exports.RequirementService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const requirement_repository_1 = require("./requirement.repository");
const Institution_model_1 = require("../../models/Institution.model");
const decimal_1 = require("../../utils/decimal");
const appError_1 = require("../../utils/appError");
class RequirementService {
    repo;
    constructor(repo = requirement_repository_1.requirementRepository) {
        this.repo = repo;
    }
    calculateCompliance(requirement) {
        const requiredAmount = decimal_1.DecimalUtils.from(requirement.requiredAmount);
        const acceptableTypes = new Set(requirement.acceptableInstrumentTypes);
        const now = new Date();
        let totalPledged = decimal_1.DecimalUtils.from(0);
        let verifiedEligible = decimal_1.DecimalUtils.from(0);
        let verifiedIneligible = decimal_1.DecimalUtils.from(0);
        let pendingVerification = decimal_1.DecimalUtils.from(0);
        let rejectedAmount = decimal_1.DecimalUtils.from(0);
        let ineligibleTypeAmount = decimal_1.DecimalUtils.from(0);
        const breakdownItems = [];
        const pledgedList = requirement.pledgedInstruments || [];
        for (const inst of pledgedList) {
            const instAmount = decimal_1.DecimalUtils.from(inst.amount);
            totalPledged = decimal_1.DecimalUtils.add(totalPledged, instAmount);
            const ineligibilityReasons = [];
            const isAcceptableType = acceptableTypes.has(inst.instrumentType);
            if (!isAcceptableType) {
                ineligibilityReasons.push(`Instrument type '${inst.instrumentType}' is not in acceptable types: [${Array.from(acceptableTypes).join(', ')}]`);
                ineligibleTypeAmount = decimal_1.DecimalUtils.add(ineligibleTypeAmount, instAmount);
            }
            const maturity = new Date(inst.maturityDate);
            if (maturity.getTime() < requirement.effectiveDate.getTime()) {
                ineligibilityReasons.push(`Instrument maturity (${maturity.toISOString().split('T')[0]}) precedes requirement effective date (${requirement.effectiveDate.toISOString().split('T')[0]})`);
            }
            if (inst.verificationStatus === 'REJECTED') {
                ineligibilityReasons.push(`Instrument was rejected during scrutiny: ${inst.remarks || 'No remarks'}`);
                rejectedAmount = decimal_1.DecimalUtils.add(rejectedAmount, instAmount);
            }
            else if (inst.verificationStatus === 'PENDING') {
                ineligibilityReasons.push('Instrument verification is currently pending official scrutiny');
                pendingVerification = decimal_1.DecimalUtils.add(pendingVerification, instAmount);
            }
            const isEligible = isAcceptableType && ineligibilityReasons.length === 0 && inst.verificationStatus === 'VERIFIED';
            if (isEligible) {
                verifiedEligible = decimal_1.DecimalUtils.add(verifiedEligible, instAmount);
            }
            else if (inst.verificationStatus === 'VERIFIED') {
                verifiedIneligible = decimal_1.DecimalUtils.add(verifiedIneligible, instAmount);
            }
            breakdownItems.push({
                instrumentId: inst.instrumentId,
                instrumentType: inst.instrumentType,
                amount: decimal_1.DecimalUtils.toFixedString(instAmount),
                amountFormatted: decimal_1.DecimalUtils.formatCurrency(instAmount, requirement.currency),
                bankName: inst.bankName,
                branchName: inst.branchName,
                maturityDate: inst.maturityDate,
                verificationStatus: inst.verificationStatus,
                isJointAccount: inst.isJointAccount,
                isEligible,
                ineligibilityReasons,
            });
        }
        const shortfall = decimal_1.DecimalUtils.calculateShortfall(requiredAmount, verifiedEligible);
        const isCompliant = decimal_1.DecimalUtils.isZero(shortfall);
        const deadline = new Date(requirement.submissionDeadline);
        const isOverdue = !isCompliant && now.getTime() > deadline.getTime();
        const diffMs = deadline.getTime() - now.getTime();
        const daysRemainingOrOverdue = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24)) * (diffMs < 0 ? -1 : 1);
        let complianceStatus = 'NOT_SUBMITTED';
        if (isCompliant) {
            complianceStatus = 'COMPLIANT';
        }
        else if (decimal_1.DecimalUtils.isGreaterThanOrEqualTo(decimal_1.DecimalUtils.add(verifiedEligible, pendingVerification), requiredAmount) && !decimal_1.DecimalUtils.isZero(pendingVerification)) {
            complianceStatus = 'UNDER_REVIEW';
        }
        else if (!decimal_1.DecimalUtils.isZero(verifiedEligible)) {
            complianceStatus = isOverdue ? 'OVERDUE' : 'PARTIALLY_COMPLIANT';
        }
        else if (!decimal_1.DecimalUtils.isZero(pendingVerification)) {
            complianceStatus = 'UNDER_REVIEW';
        }
        else {
            complianceStatus = isOverdue ? 'OVERDUE' : 'NOT_SUBMITTED';
        }
        return {
            requirementId: requirement.requirementId,
            institutionId: requirement.institutionId,
            institutionName: requirement.institutionName,
            requiredAmount: decimal_1.DecimalUtils.toFixedString(requiredAmount),
            requiredAmountFormatted: decimal_1.DecimalUtils.formatCurrency(requiredAmount, requirement.currency),
            eligibleVerifiedDeposit: decimal_1.DecimalUtils.toFixedString(verifiedEligible),
            eligibleVerifiedDepositFormatted: decimal_1.DecimalUtils.formatCurrency(verifiedEligible, requirement.currency),
            outstandingShortfall: decimal_1.DecimalUtils.toFixedString(shortfall),
            outstandingShortfallFormatted: decimal_1.DecimalUtils.formatCurrency(shortfall, requirement.currency),
            complianceStatus,
            isCompliant,
            isOverdue,
            daysRemainingOrOverdue,
            deadline,
            breakdown: {
                totalPledgedAmount: decimal_1.DecimalUtils.toFixedString(totalPledged),
                totalPledgedFormatted: decimal_1.DecimalUtils.formatCurrency(totalPledged, requirement.currency),
                verifiedEligibleAmount: decimal_1.DecimalUtils.toFixedString(verifiedEligible),
                verifiedEligibleFormatted: decimal_1.DecimalUtils.formatCurrency(verifiedEligible, requirement.currency),
                pendingVerificationAmount: decimal_1.DecimalUtils.toFixedString(pendingVerification),
                rejectedAmount: decimal_1.DecimalUtils.toFixedString(rejectedAmount),
                ineligibleTypeAmount: decimal_1.DecimalUtils.toFixedString(ineligibleTypeAmount),
                instruments: breakdownItems,
            },
            calculatedAt: now,
        };
    }
    async getRequirements(params, institutionScope) {
        const { requirements, total } = await this.repo.findWithPagination(params, institutionScope);
        const enriched = requirements.map((req) => {
            const compliance = this.calculateCompliance(req);
            return {
                ...req,
                calculatedCompliance: compliance,
                shortfall: compliance.outstandingShortfall,
                shortfallFormatted: compliance.outstandingShortfallFormatted,
                eligibleDeposit: compliance.eligibleVerifiedDeposit,
                eligibleDepositFormatted: compliance.eligibleVerifiedDepositFormatted,
            };
        });
        return { requirements: enriched, total };
    }
    async getRequirementById(id, institutionScope) {
        const requirement = await this.repo.findByIdOrRequirementId(id);
        if (!requirement) {
            throw appError_1.AppError.notFound(`Requirement with identifier '${id}' not found`);
        }
        if (institutionScope && requirement.institutionId !== institutionScope) {
            throw appError_1.AppError.forbidden('Access denied to security deposit requirement of another institution');
        }
        const compliance = this.calculateCompliance(requirement);
        return { requirement, compliance };
    }
    async createRequirement(input, user) {
        const institution = await Institution_model_1.Institution.findOne({
            $or: [
                { code: input.institutionId.toUpperCase() },
                ...(mongoose_1.default.Types.ObjectId.isValid(input.institutionId)
                    ? [{ _id: input.institutionId }]
                    : []),
            ],
        });
        if (!institution) {
            throw appError_1.AppError.badRequest(`Target institution '${input.institutionId}' does not exist`);
        }
        const year = new Date().getFullYear();
        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const requirementId = input.requirementId || `REQ-${year}-${institution.code}-${randomSuffix}`;
        const existing = await this.repo.findByIdOrRequirementId(requirementId);
        if (existing) {
            throw appError_1.AppError.conflict(`Requirement ID '${requirementId}' already exists`);
        }
        const parsedAmount = decimal_1.DecimalUtils.toFixedString(input.requiredAmount);
        const requirementDoc = await this.repo.create({
            requirementId: requirementId.toUpperCase(),
            institutionId: institution.code,
            institutionName: institution.name,
            title: input.title,
            requirementType: input.requirementType,
            requiredAmount: mongoose_1.default.Types.Decimal128.fromString(parsedAmount),
            currency: input.currency || 'INR',
            effectiveDate: input.effectiveDate ? new Date(input.effectiveDate) : new Date(),
            submissionDeadline: new Date(input.submissionDeadline),
            applicableRuleReference: input.applicableRuleReference,
            acceptableInstrumentTypes: input.acceptableInstrumentTypes,
            supportingDocumentRequirements: input.supportingDocumentRequirements || [],
            applicableBusinessRules: input.applicableBusinessRules || [],
            requirementStatus: 'ACTIVE',
            complianceStatus: 'NOT_SUBMITTED',
            createdBy: user.email,
            pledgedInstruments: [],
            activityHistory: [
                {
                    action: 'REQUIREMENT_CREATED',
                    performedBy: user.fullName || user.email,
                    performedByEmail: user.email,
                    details: `Security Deposit requirement created for ${decimal_1.DecimalUtils.formatCurrency(parsedAmount, input.currency || 'INR')} under rule '${input.applicableRuleReference}'`,
                    timestamp: new Date(),
                },
            ],
        });
        return requirementDoc;
    }
    async updateRequirement(id, input, user, institutionScope) {
        const existing = await this.repo.findByIdOrRequirementId(id);
        if (!existing) {
            throw appError_1.AppError.notFound(`Requirement '${id}' not found`);
        }
        if (institutionScope && existing.institutionId !== institutionScope) {
            throw appError_1.AppError.forbidden('Access denied to update requirement of another institution');
        }
        const updates = {};
        if (input.title)
            updates.title = input.title;
        if (input.requirementType)
            updates.requirementType = input.requirementType;
        if (input.requiredAmount) {
            const parsed = decimal_1.DecimalUtils.toFixedString(input.requiredAmount);
            updates.requiredAmount = mongoose_1.default.Types.Decimal128.fromString(parsed);
        }
        if (input.currency)
            updates.currency = input.currency;
        if (input.effectiveDate)
            updates.effectiveDate = new Date(input.effectiveDate);
        if (input.submissionDeadline)
            updates.submissionDeadline = new Date(input.submissionDeadline);
        if (input.applicableRuleReference)
            updates.applicableRuleReference = input.applicableRuleReference;
        if (input.acceptableInstrumentTypes)
            updates.acceptableInstrumentTypes = input.acceptableInstrumentTypes;
        if (input.supportingDocumentRequirements)
            updates.supportingDocumentRequirements = input.supportingDocumentRequirements;
        if (input.applicableBusinessRules)
            updates.applicableBusinessRules = input.applicableBusinessRules;
        if (input.requirementStatus)
            updates.requirementStatus = input.requirementStatus;
        const updated = await this.repo.update(existing._id.toString(), updates);
        if (!updated) {
            throw appError_1.AppError.internal('Failed to update requirement');
        }
        const compliance = this.calculateCompliance(updated);
        if (updated.complianceStatus !== compliance.complianceStatus) {
            await this.repo.update(updated._id.toString(), { complianceStatus: compliance.complianceStatus });
            updated.complianceStatus = compliance.complianceStatus;
        }
        await this.repo.appendActivityLog(updated._id.toString(), {
            action: 'REQUIREMENT_UPDATED',
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            details: `Requirement updated. New compliance status: ${compliance.complianceStatus}. Shortfall: ${compliance.outstandingShortfallFormatted}`,
            timestamp: new Date(),
        });
        return { requirement: updated, compliance };
    }
    async pledgeInstrument(id, input, user, institutionScope) {
        const existing = await this.repo.findByIdOrRequirementId(id);
        if (!existing) {
            throw appError_1.AppError.notFound(`Requirement '${id}' not found`);
        }
        if (institutionScope && existing.institutionId !== institutionScope) {
            throw appError_1.AppError.forbidden('Access denied to pledge against requirement of another institution');
        }
        const duplicate = existing.pledgedInstruments.find((p) => p.instrumentId.toUpperCase() === input.instrumentId.toUpperCase());
        if (duplicate) {
            throw appError_1.AppError.conflict(`Instrument '${input.instrumentId}' has already been pledged to this requirement`);
        }
        const parsedAmount = decimal_1.DecimalUtils.toFixedString(input.amount);
        const instrumentData = {
            instrumentId: input.instrumentId.toUpperCase(),
            instrumentType: input.instrumentType,
            bankName: input.bankName,
            branchName: input.branchName,
            amount: mongoose_1.default.Types.Decimal128.fromString(parsedAmount),
            maturityDate: new Date(input.maturityDate),
            verificationStatus: 'PENDING',
            isJointAccount: input.isJointAccount ?? true,
            pledgedAt: new Date(),
            remarks: input.remarks,
        };
        const updated = await this.repo.addPledgedInstrument(existing._id.toString(), instrumentData);
        if (!updated) {
            throw appError_1.AppError.internal('Failed to pledge instrument');
        }
        const compliance = this.calculateCompliance(updated);
        await this.repo.update(updated._id.toString(), { complianceStatus: compliance.complianceStatus });
        updated.complianceStatus = compliance.complianceStatus;
        await this.repo.appendActivityLog(updated._id.toString(), {
            action: 'INSTRUMENT_PLEDGED',
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            details: `Pledged ${input.instrumentType} #${input.instrumentId} of ${decimal_1.DecimalUtils.formatCurrency(parsedAmount, existing.currency)} from ${input.bankName}. Status: PENDING verification.`,
            timestamp: new Date(),
        });
        return { requirement: updated, compliance };
    }
    async verifyInstrument(requirementId, instrumentId, input, user) {
        const existing = await this.repo.findByIdOrRequirementId(requirementId);
        if (!existing) {
            throw appError_1.AppError.notFound(`Requirement '${requirementId}' not found`);
        }
        const instrument = existing.pledgedInstruments.find((p) => p.instrumentId.toUpperCase() === instrumentId.toUpperCase());
        if (!instrument) {
            throw appError_1.AppError.notFound(`Instrument '${instrumentId}' not found in this requirement`);
        }
        const updated = await this.repo.updateInstrumentVerification(existing._id.toString(), instrument.instrumentId, input.verificationStatus, input.remarks);
        if (!updated) {
            throw appError_1.AppError.internal('Failed to update instrument verification');
        }
        const compliance = this.calculateCompliance(updated);
        await this.repo.update(updated._id.toString(), { complianceStatus: compliance.complianceStatus });
        updated.complianceStatus = compliance.complianceStatus;
        await this.repo.appendActivityLog(updated._id.toString(), {
            action: `INSTRUMENT_${input.verificationStatus}`,
            performedBy: user.fullName || user.email,
            performedByEmail: user.email,
            details: `Instrument #${instrument.instrumentId} (${instrument.instrumentType}) was ${input.verificationStatus}. Remarks: ${input.remarks || 'None'}. New Shortfall: ${compliance.outstandingShortfallFormatted}`,
            timestamp: new Date(),
        });
        return { requirement: updated, compliance };
    }
    async getInstitutionComplianceSummary(institutionId) {
        const institution = await Institution_model_1.Institution.findOne({
            $or: [
                { code: institutionId.toUpperCase() },
                ...(mongoose_1.default.Types.ObjectId.isValid(institutionId) ? [{ _id: institutionId }] : []),
            ],
        });
        if (!institution) {
            throw appError_1.AppError.notFound(`Institution '${institutionId}' not found`);
        }
        const requirements = await this.repo.findByInstitution(institution.code);
        let totalRequired = decimal_1.DecimalUtils.from(0);
        let totalEligible = decimal_1.DecimalUtils.from(0);
        let totalShortfall = decimal_1.DecimalUtils.from(0);
        let compliantCount = 0;
        let partiallyCompliantCount = 0;
        let notSubmittedCount = 0;
        let overdueCount = 0;
        let underReviewCount = 0;
        const complianceResults = [];
        for (const req of requirements) {
            const comp = this.calculateCompliance(req);
            complianceResults.push(comp);
            totalRequired = decimal_1.DecimalUtils.add(totalRequired, comp.requiredAmount);
            totalEligible = decimal_1.DecimalUtils.add(totalEligible, comp.eligibleVerifiedDeposit);
            totalShortfall = decimal_1.DecimalUtils.add(totalShortfall, comp.outstandingShortfall);
            switch (comp.complianceStatus) {
                case 'COMPLIANT':
                    compliantCount++;
                    break;
                case 'PARTIALLY_COMPLIANT':
                    partiallyCompliantCount++;
                    break;
                case 'NOT_SUBMITTED':
                    notSubmittedCount++;
                    break;
                case 'OVERDUE':
                    overdueCount++;
                    break;
                case 'UNDER_REVIEW':
                    underReviewCount++;
                    break;
            }
        }
        const overallRate = complianceResults.length > 0
            ? Math.round((compliantCount / complianceResults.length) * 100)
            : 100;
        return {
            institutionId: institution.code,
            institutionName: institution.name,
            totalRequirements: complianceResults.length,
            compliantCount,
            partiallyCompliantCount,
            notSubmittedCount,
            overdueCount,
            underReviewCount,
            totalRequiredAmount: decimal_1.DecimalUtils.toFixedString(totalRequired),
            totalRequiredFormatted: decimal_1.DecimalUtils.formatCurrency(totalRequired),
            totalEligibleDeposit: decimal_1.DecimalUtils.toFixedString(totalEligible),
            totalEligibleFormatted: decimal_1.DecimalUtils.formatCurrency(totalEligible),
            totalShortfall: decimal_1.DecimalUtils.toFixedString(totalShortfall),
            totalShortfallFormatted: decimal_1.DecimalUtils.formatCurrency(totalShortfall),
            overallComplianceRate: overallRate,
            requirements: complianceResults,
        };
    }
    async getDashboardMetrics(institutionScope) {
        return this.repo.getDashboardMetrics(institutionScope);
    }
}
exports.RequirementService = RequirementService;
exports.requirementService = new RequirementService();
