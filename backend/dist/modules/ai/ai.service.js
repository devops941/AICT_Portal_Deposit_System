"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AiService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const AiExtraction_model_1 = require("../../models/AiExtraction.model");
const Fdr_model_1 = require("../../models/Fdr.model");
const ocr_provider_1 = require("./ocr.provider");
const classification_service_1 = require("./classification.service");
const extraction_service_1 = require("./extraction.service");
const duplicate_service_1 = require("./duplicate.service");
const comparison_service_1 = require("./comparison.service");
const ai_search_service_1 = require("./ai-search.service");
const appError_1 = require("../../utils/appError");
const logger_1 = require("../../config/logger");
class AiService {
    async extractDocumentIntelligence(params) {
        const { buffer, mimeType, fileName, instrumentId, documentId, formValues, user } = params;
        if (!buffer || buffer.length === 0) {
            throw appError_1.AppError.badRequest('Invalid or empty document buffer provided');
        }
        const fileHash = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
        const fileSize = buffer.length;
        const ocrResult = await ocr_provider_1.ocrProvider.extractText(buffer, mimeType, fileName);
        const classification = classification_service_1.documentClassificationService.classify(ocrResult.text, fileName);
        const extracted = extraction_service_1.fieldExtractionService.extractFields(ocrResult.text);
        const extractionId = `EXT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
        const duplicateFlag = await duplicate_service_1.duplicateDetectionService.detectDuplicates({
            fileHash,
            fdrNumber: extracted.fdrNumber.value,
            bankName: extracted.bankName.value,
            rawText: ocrResult.text,
            currentExtractionId: extractionId,
            currentInstrumentId: instrumentId,
        });
        let instId = user.institutionId || '';
        let fetchedFdr = null;
        if (instrumentId) {
            fetchedFdr = await Fdr_model_1.Fdr.findOne({ fdrId: instrumentId.toUpperCase() }).lean();
            if (fetchedFdr) {
                instId = fetchedFdr.institutionId;
                if (user.institutionId && user.institutionId !== fetchedFdr.institutionId) {
                    throw appError_1.AppError.forbidden('Access denied to process document for another institution FDR');
                }
            }
        }
        let comparisonData = undefined;
        const targetFormValues = formValues || (fetchedFdr ? {
            bankName: fetchedFdr.bankName,
            fdrNumber: fetchedFdr.fdrNumber,
            holderName: fetchedFdr.holderName,
            depositAmount: fetchedFdr.depositAmount ? fetchedFdr.depositAmount.toString() : undefined,
            issueDate: fetchedFdr.issueDate,
            maturityDate: fetchedFdr.maturityDate,
            branchInformation: fetchedFdr.bankBranch,
        } : {});
        if (Object.keys(targetFormValues).length > 0) {
            const compResult = await comparison_service_1.documentComparisonService.compareValues({
                formValues: targetFormValues,
                extractedValues: {
                    bankName: extracted.bankName.value,
                    fdrNumber: extracted.fdrNumber.value,
                    holderName: extracted.holderName.value,
                    depositAmount: extracted.depositAmount.value,
                    issueDate: extracted.issueDate.value,
                    maturityDate: extracted.maturityDate.value,
                    branchInformation: extracted.branchInformation.value,
                },
                instrumentId,
                institutionId: instId,
                requirementId: fetchedFdr?.requirementId,
                createDiscrepancyOnMismatch: true,
                createdBy: user.id || user.userId || 'SYSTEM',
                createdByName: user.email,
            });
            comparisonData = {
                hasMismatches: compResult.hasMismatches,
                mismatches: compResult.mismatches,
                discrepancyId: compResult.createdDiscrepancyId,
                checkedAt: new Date(),
            };
        }
        const extractionRecord = await AiExtraction_model_1.AiExtraction.create({
            extractionId,
            documentId,
            instrumentId: instrumentId ? instrumentId.toUpperCase() : undefined,
            institutionId: instId ? instId.toUpperCase() : undefined,
            fileName,
            mimeType,
            fileHash,
            fileSize,
            rawText: ocrResult.text,
            documentClassification: {
                category: classification.category,
                confidence: classification.confidence,
                reasoning: classification.reasoning,
            },
            extractedFields: {
                bankName: extracted.bankName,
                fdrNumber: extracted.fdrNumber,
                holderName: extracted.holderName,
                depositAmount: extracted.depositAmount,
                issueDate: extracted.issueDate,
                maturityDate: extracted.maturityDate,
                branchInformation: extracted.branchInformation,
            },
            overallConfidence: ocrResult.isUnreadable ? 0 : extracted.overallConfidence,
            duplicateRiskFlag: duplicateFlag,
            comparisonResult: comparisonData,
            officerConfirmed: false,
        });
        if (duplicateFlag.isDuplicateSuspected && instrumentId) {
            await Fdr_model_1.Fdr.updateOne({ fdrId: instrumentId.toUpperCase() }, {
                $set: {
                    isDuplicateFlagged: true,
                    duplicateReviewNotes: duplicateFlag.details,
                },
            });
        }
        logger_1.logger.info(`AI Document Extraction complete: ${extractionId} for file "${fileName}". Overall confidence: ${extractionRecord.overallConfidence}%. Duplicate: ${duplicateFlag.isDuplicateSuspected}`);
        return extractionRecord;
    }
    async classifyDocument(buffer, mimeType, fileName) {
        const ocrResult = await ocr_provider_1.ocrProvider.extractText(buffer, mimeType, fileName);
        return classification_service_1.documentClassificationService.classify(ocrResult.text, fileName);
    }
    async compareDocument(params) {
        const { extractionId, instrumentId, formValues, user } = params;
        let extraction = null;
        if (extractionId) {
            extraction = await AiExtraction_model_1.AiExtraction.findOne({ extractionId: extractionId.toUpperCase() });
        }
        else if (instrumentId) {
            extraction = await AiExtraction_model_1.AiExtraction.findOne({ instrumentId: instrumentId.toUpperCase() }).sort({
                createdAt: -1,
            });
        }
        if (!extraction) {
            throw appError_1.AppError.notFound('No AI extraction record found to perform comparison against');
        }
        if (user.institutionId && extraction.institutionId && user.institutionId !== extraction.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to extraction of another institution');
        }
        let targetForm = formValues;
        if (!targetForm && extraction.instrumentId) {
            const fdr = await Fdr_model_1.Fdr.findOne({ fdrId: extraction.instrumentId }).lean();
            if (fdr) {
                targetForm = {
                    bankName: fdr.bankName,
                    fdrNumber: fdr.fdrNumber,
                    holderName: fdr.holderName,
                    depositAmount: fdr.depositAmount ? fdr.depositAmount.toString() : undefined,
                    issueDate: fdr.issueDate,
                    maturityDate: fdr.maturityDate,
                    branchInformation: fdr.bankBranch,
                };
            }
        }
        if (!targetForm) {
            throw appError_1.AppError.badRequest('No form values supplied or associated instrument found');
        }
        const comparison = await comparison_service_1.documentComparisonService.compareValues({
            formValues: targetForm,
            extractedValues: {
                bankName: extraction.extractedFields.bankName.value,
                fdrNumber: extraction.extractedFields.fdrNumber.value,
                holderName: extraction.extractedFields.holderName.value,
                depositAmount: extraction.extractedFields.depositAmount.value,
                issueDate: extraction.extractedFields.issueDate.value,
                maturityDate: extraction.extractedFields.maturityDate.value,
                branchInformation: extraction.extractedFields.branchInformation.value,
            },
            instrumentId: extraction.instrumentId,
            institutionId: extraction.institutionId,
            createDiscrepancyOnMismatch: true,
            createdBy: user.id || user.userId || 'SYSTEM',
            createdByName: user.email,
        });
        extraction.comparisonResult = {
            hasMismatches: comparison.hasMismatches,
            mismatches: comparison.mismatches,
            discrepancyId: comparison.createdDiscrepancyId,
            checkedAt: new Date(),
        };
        await extraction.save();
        return comparison;
    }
    async getExtractionById(extractionId, user) {
        const extraction = await AiExtraction_model_1.AiExtraction.findOne({
            $or: [
                { extractionId: extractionId.toUpperCase() },
                { documentId: extractionId.toUpperCase() },
            ],
        });
        if (!extraction) {
            throw appError_1.AppError.notFound(`AI Extraction record ${extractionId} not found`);
        }
        if (user.institutionId && extraction.institutionId && user.institutionId !== extraction.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to view extraction of another institution');
        }
        return extraction;
    }
    async manualCorrection(extractionId, input, user) {
        const extraction = await AiExtraction_model_1.AiExtraction.findOne({ extractionId: extractionId.toUpperCase() });
        if (!extraction) {
            throw appError_1.AppError.notFound(`Extraction ${extractionId} not found`);
        }
        if (user.institutionId && extraction.institutionId && user.institutionId !== extraction.institutionId) {
            throw appError_1.AppError.forbidden('Access denied to update extraction of another institution');
        }
        const updatedFields = {};
        for (const [key, val] of Object.entries(input.correctedFields)) {
            if (val !== undefined && extraction.extractedFields[key]) {
                extraction.extractedFields[key].value = val;
                extraction.extractedFields[key].isOverridden = true;
                extraction.extractedFields[key].confidence = 100;
                updatedFields[key] = val;
            }
        }
        extraction.isManualCorrection = true;
        extraction.correctedFields = updatedFields;
        extraction.correctedBy = user.id || user.userId;
        extraction.correctedAt = new Date();
        if (input.confirmExtraction) {
            extraction.officerConfirmed = true;
            extraction.officerConfirmedBy = user.id || user.userId;
            extraction.officerConfirmedAt = new Date();
        }
        const fieldConfidences = Object.values(extraction.extractedFields).map((f) => f.confidence);
        extraction.overallConfidence = Math.round(fieldConfidences.reduce((acc, c) => acc + c, 0) / fieldConfidences.length);
        await extraction.save();
        logger_1.logger.info(`Manual correction applied to AI Extraction ${extractionId} by ${user.email}`);
        return extraction;
    }
    async getRiskFlags(user) {
        const filter = {
            $or: [
                { 'duplicateRiskFlag.isDuplicateSuspected': true },
                { 'comparisonResult.hasMismatches': true },
            ],
        };
        if (user.institutionId) {
            filter.institutionId = user.institutionId.toUpperCase();
        }
        const records = await AiExtraction_model_1.AiExtraction.find(filter)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return records.map((r) => ({
            extractionId: r.extractionId,
            documentId: r.documentId,
            instrumentId: r.instrumentId,
            institutionId: r.institutionId,
            fileName: r.fileName,
            classification: r.documentClassification?.category,
            duplicateRisk: r.duplicateRiskFlag,
            comparison: r.comparisonResult,
            overallConfidence: r.overallConfidence,
            officerConfirmed: r.officerConfirmed,
            createdAt: r.createdAt,
        }));
    }
    async search(query, user) {
        return ai_search_service_1.aiSearchService.search(query, user);
    }
}
exports.AiService = AiService;
exports.aiService = new AiService();
