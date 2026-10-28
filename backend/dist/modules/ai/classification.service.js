"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentClassificationService = exports.DocumentClassificationService = void 0;
class DocumentClassificationService {
    classify(text, fileName = '') {
        if (!text || text.trim().length < 10) {
            return {
                category: 'Unknown Document',
                confidence: 0,
                reasoning: 'Insufficient extractable text to determine statutory document classification.',
            };
        }
        const lower = text.toLowerCase();
        const lowerFile = fileName.toLowerCase();
        const renewalScore = this.scoreKeywords(lower, lowerFile, [
            'renewal advice',
            'renewed fdr',
            'renewal certificate',
            'extended maturity',
            'reinvested',
            'superseded fdr',
            'previous instrument',
            'renewal receipt',
        ]);
        const fdrScore = this.scoreKeywords(lower, lowerFile, [
            'fixed deposit',
            'term deposit',
            'fdr no',
            'fdr number',
            'deposit receipt',
            'special term deposit',
            'principal amount',
            'maturity date',
            'rate of interest',
            'deposit certificate',
        ]);
        const bankConfirmScore = this.scoreKeywords(lower, lowerFile, [
            'bank confirmation',
            'confirmation letter',
            'sfms advice',
            'lien marked',
            'lien in favor of',
            'safe custody',
            'bank guarantee',
            'branch manager confirmation',
        ]);
        const releaseScore = this.scoreKeywords(lower, lowerFile, [
            'release authorization',
            'discharge sanction',
            'deposit release',
            'revocation of lien',
            'lien cancellation',
            'no dues certificate',
            'closure sanction',
            'refund authorization',
        ]);
        const supportingScore = this.scoreKeywords(lower, lowerFile, [
            'board resolution',
            'governing council',
            'authorization letter',
            'university resolution',
            'affidavit',
            'trust resolution',
            'minutes of meeting',
        ]);
        const candidates = [
            {
                category: 'Renewal Certificate',
                score: renewalScore,
                reasoning: 'Document contains renewal advice, extended maturity indicators, and rollover references.',
            },
            {
                category: 'FDR Certificate',
                score: fdrScore,
                reasoning: 'Document exhibits primary Fixed Deposit Receipt indicators, certificate references, and interest schedules.',
            },
            {
                category: 'Bank Confirmation',
                score: bankConfirmScore,
                reasoning: 'Document matches bank confirmation letter or lien marking notification criteria.',
            },
            {
                category: 'Release Authorization',
                score: releaseScore,
                reasoning: 'Document contains statutory lien revocation, no-dues, or refund sanction terminology.',
            },
            {
                category: 'Supporting Document',
                score: supportingScore,
                reasoning: 'Document matches institutional governing resolution or supporting administrative mandate.',
            },
        ];
        candidates.sort((a, b) => b.score - a.score);
        const top = candidates[0];
        if (top.score < 12) {
            return {
                category: 'Unknown Document',
                confidence: Math.round(top.score),
                reasoning: 'Text lacks unambiguous statutory banking or deposit keywords.',
            };
        }
        const confidence = Math.min(98, Math.max(50, Math.round(40 + top.score * 0.8)));
        return {
            category: top.category,
            confidence,
            reasoning: top.reasoning,
        };
    }
    scoreKeywords(text, fileName, keywords) {
        let score = 0;
        for (const kw of keywords) {
            if (text.includes(kw))
                score += 15;
            if (fileName.includes(kw.replace(/\s+/g, '')))
                score += 10;
        }
        return score;
    }
}
exports.DocumentClassificationService = DocumentClassificationService;
exports.documentClassificationService = new DocumentClassificationService();
