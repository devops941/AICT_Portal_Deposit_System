"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSearchService = exports.AiSearchService = void 0;
const Fdr_model_1 = require("../../models/Fdr.model");
const Requirement_model_1 = require("../../models/Requirement.model");
const Release_model_1 = require("../../models/Release.model");
const appError_1 = require("../../utils/appError");
const logger_1 = require("../../config/logger");
class AiSearchService {
    async search(query, user) {
        if (!query || query.trim().length === 0) {
            throw appError_1.AppError.badRequest('Search query cannot be empty');
        }
        const cleanQuery = query.trim();
        const lower = cleanQuery.toLowerCase();
        let domain = 'FDRS';
        let interpretedIntent = '';
        let filterApplied = {};
        const now = new Date();
        const daysMatch = lower.match(/(?:maturing|due|expire|expiring)\s+(?:in\s+)?(?:the\s+)?(?:next\s+)?(\d+)\s*days?/i);
        if (daysMatch || lower.includes('maturing soon') || lower.includes('approaching maturity')) {
            domain = 'FDRS';
            const days = daysMatch ? parseInt(daysMatch[1], 10) : 30;
            const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            interpretedIntent = `Locate active instruments maturing within the next ${days} days (between ${now.toISOString().split('T')[0]} and ${targetDate.toISOString().split('T')[0]}).`;
            filterApplied = {
                maturityDate: {
                    $gte: now,
                    $lte: targetDate,
                },
                lifecycleStatus: { $in: ['ACTIVE', 'MATURED'] },
            };
        }
        else if (lower.includes('shortfall') ||
            lower.includes('non-compliant') ||
            lower.includes('deficit') ||
            lower.includes('deposit shortfall') ||
            lower.includes('outstanding deposit')) {
            domain = 'REQUIREMENTS';
            interpretedIntent = 'Filter deposit requirements exhibiting compliance deficits or outstanding shortfall.';
            filterApplied = {
                complianceStatus: { $in: ['PARTIALLY_COMPLIANT', 'NOT_SUBMITTED', 'OVERDUE'] },
                status: 'ACTIVE',
            };
        }
        else if (lower.includes('release') ||
            lower.includes('refund') ||
            lower.includes('discharge')) {
            domain = 'RELEASES';
            if (lower.includes('pending') || lower.includes('review') || lower.includes('under review')) {
                interpretedIntent = 'Retrieve pending and under-scrutiny deposit release requests.';
                filterApplied = {
                    status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED'] },
                };
            }
            else if (lower.includes('approved') || lower.includes('authorized')) {
                interpretedIntent = 'Retrieve approved or authorized release disbursements.';
                filterApplied = {
                    status: { $in: ['APPROVED', 'AUTHORIZED_RELEASE'] },
                };
            }
            else {
                interpretedIntent = 'Retrieve all accessible security deposit release requests.';
                filterApplied = {};
            }
        }
        else if (lower.includes('pending verification') ||
            lower.includes('unverified') ||
            lower.includes('under scrutiny') ||
            lower.includes('scrutiny pending')) {
            domain = 'FDRS';
            interpretedIntent = 'Retrieve instruments currently pending scrutiny or under active officer verification.';
            filterApplied = {
                verificationStatus: { $in: ['PENDING', 'UNDER_SCRUTINY'] },
            };
        }
        else if (lower.includes('matured') || lower.includes('expired instruments')) {
            domain = 'FDRS';
            interpretedIntent = 'Retrieve all instruments whose tenure has elapsed and are marked MATURED.';
            filterApplied = {
                lifecycleStatus: 'MATURED',
            };
        }
        else if (lower.includes('state bank') ||
            lower.includes('sbi') ||
            lower.includes('hdfc') ||
            lower.includes('icici') ||
            lower.includes('pnb') ||
            lower.includes('punjab national') ||
            lower.includes('canara') ||
            lower.includes('axis') ||
            lower.includes('bank of baroda')) {
            domain = 'FDRS';
            let bank = 'Bank';
            if (lower.includes('state bank') || lower.includes('sbi'))
                bank = 'State Bank of India';
            else if (lower.includes('hdfc'))
                bank = 'HDFC Bank';
            else if (lower.includes('icici'))
                bank = 'ICICI Bank';
            else if (lower.includes('pnb') || lower.includes('punjab national'))
                bank = 'Punjab National Bank';
            else if (lower.includes('canara'))
                bank = 'Canara Bank';
            else if (lower.includes('axis'))
                bank = 'Axis Bank';
            else if (lower.includes('bank of baroda'))
                bank = 'Bank of Baroda';
            interpretedIntent = `Filter FDR instruments registered with ${bank}.`;
            filterApplied = {
                bankName: { $regex: bank, $options: 'i' },
            };
        }
        else {
            domain = 'FDRS';
            interpretedIntent = `Keyword search across FDR instruments matching terms in "${cleanQuery}".`;
            filterApplied = {
                $or: [
                    { fdrNumber: { $regex: cleanQuery.replace(/[^a-zA-Z0-9]/g, ''), $options: 'i' } },
                    { bankName: { $regex: cleanQuery, $options: 'i' } },
                    { holderName: { $regex: cleanQuery, $options: 'i' } },
                ],
            };
        }
        if (user.institutionId) {
            filterApplied.institutionId = user.institutionId.toUpperCase();
        }
        let results = [];
        if (domain === 'FDRS') {
            results = await Fdr_model_1.Fdr.find(filterApplied)
                .sort({ updatedAt: -1 })
                .limit(50)
                .select('fdrId institutionId institutionName bankName fdrNumber depositAmount maturityDate verificationStatus lifecycleStatus isDuplicateFlagged')
                .lean();
        }
        else if (domain === 'REQUIREMENTS') {
            results = await Requirement_model_1.Requirement.find(filterApplied)
                .sort({ updatedAt: -1 })
                .limit(50)
                .select('requirementId institutionId requirementTitle requiredAmount complianceStatus shortfall submissionDeadline status')
                .lean();
        }
        else if (domain === 'RELEASES') {
            results = await Release_model_1.Release.find(filterApplied)
                .sort({ updatedAt: -1 })
                .limit(50)
                .select('releaseRequestId institutionId instrumentId requestedAmount status approvalStatus requestReason createdAt')
                .lean();
        }
        logger_1.logger.info(`AI Search executed for user ${user.id || user.userId} (${user.email}). Domain: ${domain}, Results: ${results.length}`);
        return {
            query: cleanQuery,
            interpretedIntent,
            filterApplied,
            domain,
            totalResults: results.length,
            results,
        };
    }
}
exports.AiSearchService = AiSearchService;
exports.aiSearchService = new AiSearchService();
