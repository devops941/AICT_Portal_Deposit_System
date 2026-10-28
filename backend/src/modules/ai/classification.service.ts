import { DocumentClassificationCategory, DocumentClassificationResult } from './ocr.types';

export class DocumentClassificationService {
  /**
   * Classify document text into statutory categories with confidence scores
   */
  classify(text: string, fileName: string = ''): DocumentClassificationResult {
    if (!text || text.trim().length < 10) {
      return {
        category: 'Unknown Document',
        confidence: 0,
        reasoning: 'Insufficient extractable text to determine statutory document classification.',
      };
    }

    const lower = text.toLowerCase();
    const lowerFile = fileName.toLowerCase();

    // 1. Renewal Certificate Check
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

    // 2. FDR Certificate Check
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

    // 3. Bank Confirmation Check
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

    // 4. Release Authorization Check
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

    // 5. Supporting Document Check
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
        category: 'Renewal Certificate' as DocumentClassificationCategory,
        score: renewalScore,
        reasoning: 'Document contains renewal advice, extended maturity indicators, and rollover references.',
      },
      {
        category: 'FDR Certificate' as DocumentClassificationCategory,
        score: fdrScore,
        reasoning: 'Document exhibits primary Fixed Deposit Receipt indicators, certificate references, and interest schedules.',
      },
      {
        category: 'Bank Confirmation' as DocumentClassificationCategory,
        score: bankConfirmScore,
        reasoning: 'Document matches bank confirmation letter or lien marking notification criteria.',
      },
      {
        category: 'Release Authorization' as DocumentClassificationCategory,
        score: releaseScore,
        reasoning: 'Document contains statutory lien revocation, no-dues, or refund sanction terminology.',
      },
      {
        category: 'Supporting Document' as DocumentClassificationCategory,
        score: supportingScore,
        reasoning: 'Document matches institutional governing resolution or supporting administrative mandate.',
      },
    ];

    // Sort descending by score
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

  private scoreKeywords(text: string, fileName: string, keywords: string[]): number {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += 15;
      if (fileName.includes(kw.replace(/\s+/g, ''))) score += 10;
    }
    return score;
  }
}

export const documentClassificationService = new DocumentClassificationService();
