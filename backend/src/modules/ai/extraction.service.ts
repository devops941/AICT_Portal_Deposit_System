import { ExtractedFdrFields, IExtractedField } from './ocr.types';

export class FieldExtractionService {
  /**
   * Extract statutory FDR fields from raw OCR text with confidence scoring
   */
  extractFields(text: string): ExtractedFdrFields {
    if (!text || text.trim().length === 0) {
      return this.emptyFields();
    }

    const bankName = this.extractBankName(text);
    const fdrNumber = this.extractFdrNumber(text);
    const holderName = this.extractHolderName(text);
    const depositAmount = this.extractDepositAmount(text);
    const issueDate = this.extractIssueDate(text);
    const maturityDate = this.extractMaturityDate(text);
    const branchInformation = this.extractBranchInformation(text);

    // Calculate weighted overall confidence
    const fieldConfidences = [
      bankName.confidence * 0.15,
      fdrNumber.confidence * 0.25,
      depositAmount.confidence * 0.25,
      issueDate.confidence * 0.1,
      maturityDate.confidence * 0.15,
      holderName.confidence * 0.05,
      branchInformation.confidence * 0.05,
    ];
    const totalWeight = 0.15 + 0.25 + 0.25 + 0.1 + 0.15 + 0.05 + 0.05;
    const overallConfidence = Math.round(
      fieldConfidences.reduce((acc, c) => acc + c, 0) / totalWeight
    );

    return {
      bankName,
      fdrNumber,
      holderName,
      depositAmount,
      issueDate,
      maturityDate,
      branchInformation,
      overallConfidence,
    };
  }

  private emptyFields(): ExtractedFdrFields {
    const emptyField = (): IExtractedField => ({
      value: '',
      confidence: 0,
      rawSnippet: '',
      isOverridden: false,
    });
    return {
      bankName: emptyField(),
      fdrNumber: emptyField(),
      holderName: emptyField(),
      depositAmount: emptyField(),
      issueDate: emptyField(),
      maturityDate: emptyField(),
      branchInformation: emptyField(),
      overallConfidence: 0,
    };
  }

  private extractBankName(text: string): IExtractedField {
    const knownBanks = [
      'State Bank of India',
      'Punjab National Bank',
      'HDFC Bank',
      'ICICI Bank',
      'Axis Bank',
      'Canara Bank',
      'Bank of Baroda',
      'Union Bank of India',
      'Central Bank of India',
      'Kotak Mahindra Bank',
      'Indian Bank',
      'Bank of India',
      'IndusInd Bank',
      'IDBI Bank',
      'Federal Bank',
      'Indian Overseas Bank',
    ];

    for (const bank of knownBanks) {
      const idx = text.toLowerCase().indexOf(bank.toLowerCase());
      if (idx !== -1) {
        const snippet = text.substring(Math.max(0, idx - 10), Math.min(text.length, idx + bank.length + 20));
        return {
          value: bank,
          confidence: 95,
          rawSnippet: snippet.trim(),
        };
      }
    }

    // Generic Bank regex: "Bank Name: XYZ" or "XYZ Bank"
    const bankRegex = /(?:Bank\s*Name\s*[:\-]\s*|Bank\s*[:\-]\s*)([A-Za-z\s]{3,35}\b(?:Bank|Ltd|Limited)?)/i;
    const match = text.match(bankRegex);
    if (match && match[1]) {
      const val = match[1].trim();
      return {
        value: val,
        confidence: 75,
        rawSnippet: match[0].trim(),
      };
    }

    // Check for any word ending with "Bank"
    const wordBankRegex = /([A-Za-z\s]{2,20}\s+Bank)/i;
    const wordMatch = text.match(wordBankRegex);
    if (wordMatch && wordMatch[1]) {
      return {
        value: wordMatch[1].trim(),
        confidence: 60,
        rawSnippet: wordMatch[0].trim(),
      };
    }

    return { value: '', confidence: 0, rawSnippet: '' };
  }

  private extractFdrNumber(text: string): IExtractedField {
    // Patterns like FDR No: FDR-123456, Fixed Deposit No: 12345678, FDR # 987654
    const patterns = [
      /(?:FDR\s*(?:No|Number|#|Ref)?\s*[:\-]?\s*)([A-Z0-9\-\/]{5,25})/i,
      /(?:Fixed\s*Deposit\s*(?:Receipt\s*)?(?:No|Number|#)?\s*[:\-]?\s*)([A-Z0-9\-\/]{5,25})/i,
      /(?:Term\s*Deposit\s*(?:Receipt\s*)?(?:No|Number|#)?\s*[:\-]?\s*)([A-Z0-9\-\/]{5,25})/i,
      /(?:Receipt\s*(?:No|Number|#)?\s*[:\-]?\s*)([A-Z0-9\-\/]{5,25})/i,
      /(?:Account\s*(?:No|Number)\s*[:\-]?\s*)([0-9]{9,18})/i,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const val = match[1].trim();
        // Disqualify if it looks like a date or pure generic word
        if (!/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/.test(val) && val.length >= 4) {
          return {
            value: val,
            confidence: 92,
            rawSnippet: match[0].trim(),
          };
        }
      }
    }

    return { value: '', confidence: 0, rawSnippet: '' };
  }

  private extractHolderName(text: string): IExtractedField {
    const patterns = [
      /(?:Name\s*of\s*(?:the\s*)?Holder\s*[:\-]?\s*)([A-Za-z0-9\s,\.\(\)\&]{4,60})/i,
      /(?:Holder\s*Name\s*[:\-]?\s*)([A-Za-z0-9\s,\.\(\)\&]{4,60})/i,
      /(?:In\s*favo(?:u)?r\s*of\s*[:\-]?\s*)([A-Za-z0-9\s,\.\(\)\&]{4,60})/i,
      /(?:Depositor\s*Name\s*[:\-]?\s*)([A-Za-z0-9\s,\.\(\)\&]{4,60})/i,
      /(?:Account\s*Name\s*[:\-]?\s*)([A-Za-z0-9\s,\.\(\)\&]{4,60})/i,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        // Take up to first newline or major punctuation delimiter
        const cleaned = match[1].split(/[\r\n]|(?:\s{3,})/)[0].trim();
        if (cleaned.length >= 3) {
          return {
            value: cleaned,
            confidence: 85,
            rawSnippet: match[0].trim(),
          };
        }
      }
    }

    return { value: '', confidence: 0, rawSnippet: '' };
  }

  private extractDepositAmount(text: string): IExtractedField {
    // Patterns matching: Deposit Amount: ₹10,00,000 or Rs. 10,00,000 or Principal Amount: 1000000
    const patterns = [
      /(?:Deposit\s*Amount|Principal\s*Amount|Amount|Deposit\s*Value)\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/i,
      /(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|[0-9]{4,12}(?:\.[0-9]{2})?)/i,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const rawNum = match[1].replace(/,/g, '').trim();
        const num = parseFloat(rawNum);
        if (!isNaN(num) && num > 0) {
          return {
            value: num.toString(),
            confidence: 90,
            rawSnippet: match[0].trim(),
          };
        }
      }
    }

    return { value: '', confidence: 0, rawSnippet: '' };
  }

  private extractIssueDate(text: string): IExtractedField {
    const patterns = [
      /(?:Date\s*of\s*Issue|Issue\s*Date|Booking\s*Date|Opened\s*On|Created\s*Date)\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i,
      /(?:Effective\s*Date)\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const parsed = this.normalizeDateString(match[1].trim());
        if (parsed) {
          return {
            value: parsed,
            confidence: 88,
            rawSnippet: match[0].trim(),
          };
        }
      }
    }

    return { value: '', confidence: 0, rawSnippet: '' };
  }

  private extractMaturityDate(text: string): IExtractedField {
    const patterns = [
      /(?:Date\s*of\s*Maturity|Maturity\s*Date|Due\s*Date|Matures\s*On|Expiry\s*Date)\s*[:\-]?\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const parsed = this.normalizeDateString(match[1].trim());
        if (parsed) {
          return {
            value: parsed,
            confidence: 90,
            rawSnippet: match[0].trim(),
          };
        }
      }
    }

    return { value: '', confidence: 0, rawSnippet: '' };
  }

  private extractBranchInformation(text: string): IExtractedField {
    const patterns = [
      /(?:Branch\s*(?:Name|Office)?\s*[:\-]?\s*)([A-Za-z0-9\s,\.\-]{3,50})/i,
      /(?:Branch\s*Code\s*[:\-]?\s*)([A-Za-z0-9\-]{3,15})/i,
      /(?:IFSC\s*(?:Code)?\s*[:\-]?\s*)([A-Z]{4}0[A-Z0-9]{6})/i,
    ];

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const cleaned = match[1].split(/[\r\n]|(?:\s{3,})/)[0].trim();
        if (cleaned.length >= 3) {
          return {
            value: cleaned,
            confidence: 82,
            rawSnippet: match[0].trim(),
          };
        }
      }
    }

    return { value: '', confidence: 0, rawSnippet: '' };
  }

  /**
   * Normalize various date strings (DD/MM/YYYY or YYYY-MM-DD) to ISO YYYY-MM-DD
   */
  private normalizeDateString(dateStr: string): string | null {
    try {
      // Check DD/MM/YYYY or DD-MM-YYYY
      const dmy = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
      if (dmy) {
        const day = dmy[1].padStart(2, '0');
        const month = dmy[2].padStart(2, '0');
        const year = dmy[3];
        return `${year}-${month}-${day}`;
      }

      // Check YYYY-MM-DD or YYYY/MM/DD
      const ymd = dateStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
      if (ymd) {
        const year = ymd[1];
        const month = ymd[2].padStart(2, '0');
        const day = ymd[3].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch {
      return null;
    }
    return null;
  }
}

export const fieldExtractionService = new FieldExtractionService();
