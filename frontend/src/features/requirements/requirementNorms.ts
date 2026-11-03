import { RequirementType, InstrumentType } from './types';

export interface RequirementNormDefinition {
  type: RequirementType;
  label: string;
  minAmount: number;
  defaultAmount: number;
  quickAmounts: number[];
  defaultTitle: string;
  titlePresets: string[];
  ruleReference: string;
  acceptableInstruments: InstrumentType[];
  supportingDocs: string[];
  businessRules: string[];
  lockInTenureYears: number;
}

export const AICTE_STATUTORY_NORMS: Record<RequirementType, RequirementNormDefinition> = {
  NEW_INSTITUTION_ESTABLISHMENT: {
    type: 'NEW_INSTITUTION_ESTABLISHMENT',
    label: 'New Institution Escrow',
    minAmount: 5000000, // ₹50 Lakhs
    defaultAmount: 5000000,
    quickAmounts: [5000000, 7500000, 10000000],
    defaultTitle: 'Statutory Security Deposit for Establishment of New Technical Institution (AY 2026-27)',
    titlePresets: [
      'Statutory Security Deposit for Establishment of New Technical Institution (AY 2026-27)',
      'Mandatory Security Deposit for New Autonomous Engineering College Inception',
      'Statutory Escrow for Deemed-to-be-University New Constituent Campus',
    ],
    ruleReference: 'AICTE Approval Process Handbook (APH) 2026-27, Chapter IV, Section 4.1.2',
    acceptableInstruments: ['FDR', 'BANK_GUARANTEE'],
    supportingDocs: [
      'Tripartite Bank Confirmation Letter with AICTE Lien Endorsement',
      'Copy of Joint Fixed Deposit Receipt (Physical Scan)',
      'Society/Trust Board Resolution authorizing Joint Mandate with Member Secretary AICTE',
      'Scheduled Commercial Bank Non-Encumbrance Certificate',
    ],
    businessRules: [
      'FDR must be drawn jointly in name of Principal/Dean and Member Secretary AICTE',
      'Mandatory lock-in tenure: 10 years (120 months) with irrevocable bank lien',
      'Auto-renewal clause must be active at prevailing scheduled interest rates',
      'Premature liquidation without written sanction from Regional Officer AICTE is strictly prohibited',
    ],
    lockInTenureYears: 10,
  },

  PROGRAM_EXPANSION: {
    type: 'PROGRAM_EXPANSION',
    label: 'Program Expansion Deposit',
    minAmount: 2500000, // ₹25 Lakhs
    defaultAmount: 2500000,
    quickAmounts: [2500000, 3500000, 5000000],
    defaultTitle: 'Statutory Deposit for Technical Program Expansion & Intake Augmentation',
    titlePresets: [
      'Statutory Deposit for Technical Program Expansion & Intake Augmentation',
      'Mandatory Security Deposit for Inception of B.Tech AI & Data Science (Intake: 60 Seats)',
      'Security Deposit for Advanced PG Technical Programs (Robotics & Automation)',
      'Statutory Deposit for Emerging Technology Division Augmentation',
    ],
    ruleReference: 'AICTE APH 2026-27, Chapter II, Clause 2.14.3',
    acceptableInstruments: ['FDR', 'BANK_GUARANTEE'],
    supportingDocs: [
      'Original FDR Certificate Copy with Bank Branch Seal',
      'Structural Safety and Laboratory Equipment Procurement Undertaking',
      'Bank Joint Account Mandate Letter',
    ],
    businessRules: [
      'Joint pledge with Regional Officer AICTE for a tenure of 5 years (60 months)',
      'Deposit must be unencumbered and free from any commercial overdraft or credit facility',
    ],
    lockInTenureYears: 5,
  },

  LAND_DEFICIENCY_ESCROW: {
    type: 'LAND_DEFICIENCY_ESCROW',
    label: 'Land Deficiency Escrow',
    minAmount: 2000000, // ₹20 Lakhs
    defaultAmount: 2000000,
    quickAmounts: [2000000, 3000000, 4000000],
    defaultTitle: 'Statutory Escrow Guarantee for Urban Land Area Deficiency Compliance',
    titlePresets: [
      'Statutory Escrow Guarantee for Urban Land Area Deficiency Compliance',
      'Conditional Security Escrow for Metro Campus Built-up Area Relaxation',
    ],
    ruleReference: 'AICTE Land Norms Relaxation Policy 2026-27, Schedule B',
    acceptableInstruments: ['FDR', 'BANK_GUARANTEE'],
    supportingDocs: [
      'Town Planning / Municipal Land Assessment Clearance Certificate',
      'Registered Trust Undertaking for FAR/FSI Built-up Area Compliance',
      'Irrevocable Bank Escrow Guarantee Letter',
    ],
    businessRules: [
      'Escrow held until permanent infrastructure expansion milestone is certified',
      'Annual physical inspection compliance required prior to any tenure extension',
    ],
    lockInTenureYears: 5,
  },

  ANNUAL_COMPLIANCE: {
    type: 'ANNUAL_COMPLIANCE',
    label: 'Annual Affiliation Compliance',
    minAmount: 1500000, // ₹15 Lakhs
    defaultAmount: 1500000,
    quickAmounts: [1500000, 2000000, 2500000],
    defaultTitle: 'Annual Statutory Affiliation & Research Infrastructure Escrow (AY 2026-27)',
    titlePresets: [
      'Annual Statutory Affiliation & Research Infrastructure Escrow (AY 2026-27)',
      'Mandatory Annual Escrow for Equipment Upgradation & Innovation Labs',
      'Statutory Escrow Deposit for Autonomous Status Annual Extension',
    ],
    ruleReference: 'AICTE Approval Process Handbook Clause 4.3 (Annual Escrow Standards)',
    acceptableInstruments: ['FDR', 'BANK_GUARANTEE', 'GOVERNMENT_BOND'],
    supportingDocs: [
      'Annual Audit Compliance Verification Report',
      'Bank Statement confirming unencumbered status of the deposit',
    ],
    businessRules: [
      'Maintained on a rolling annual cycle with automatic extension endorsement',
    ],
    lockInTenureYears: 1,
  },

  ADDITIONAL_COURSE_INSPECTION: {
    type: 'ADDITIONAL_COURSE_INSPECTION',
    label: 'Course Inspection Deposit',
    minAmount: 1000000, // ₹10 Lakhs
    defaultAmount: 1000000,
    quickAmounts: [1000000, 1500000, 2000000],
    defaultTitle: 'Security Escrow for Additional Course Approval Expert Committee Inspection',
    titlePresets: [
      'Security Escrow for Additional Course Approval Expert Committee Inspection',
      'Statutory Escrow for Emerging Specialized Course Inception Inspection',
    ],
    ruleReference: 'AICTE APH 2026-27, Chapter I, Clause 1.8 (Inspection Security)',
    acceptableInstruments: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT'],
    supportingDocs: [
      'Expert Visit Committee (EVC) Inspection Application Form',
      'Receipt of Inspection Deposit Endorsement',
    ],
    businessRules: [
      'Locked until final approval notification (LoA) is formally gazetted',
    ],
    lockInTenureYears: 3,
  },

  PENALTY_ESCROW: {
    type: 'PENALTY_ESCROW',
    label: 'Penalty Escrow Mandate',
    minAmount: 500000, // ₹5 Lakhs
    defaultAmount: 500000,
    quickAmounts: [500000, 1000000, 2500000],
    defaultTitle: 'Statutory Penalty Escrow Deposit under Regulatory Mandate',
    titlePresets: [
      'Statutory Penalty Escrow Deposit under Regulatory Mandate',
      'Standing Hearing Committee (SHC) Compliance Escrow Deposit',
    ],
    ruleReference: 'AICTE Standing Hearing Committee (SHC) Penalty Orders',
    acceptableInstruments: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT'],
    supportingDocs: [
      'AICTE Hearing Committee Sanction Notice',
      'Bank Deposit Receipt referencing Penalty Case Number',
    ],
    businessRules: [
      'Strict forfeiture condition in case of repeated statutory violation',
    ],
    lockInTenureYears: 1,
  },
};

/**
 * Get statutory minimum deposit amount in INR for a given requirement type
 */
export function getMinimumStatutoryAmount(type: RequirementType): number {
  return AICTE_STATUTORY_NORMS[type]?.minAmount || 500000;
}

/**
 * Format numbers in Indian number formatting (e.g. 50,00,000 -> 50 Lakhs)
 */
export function formatLakhsCrores(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Crore${cr > 1 ? 's' : ''}`;
  }
  if (amount >= 100000) {
    const lk = amount / 100000;
    return `₹${lk % 1 === 0 ? lk : lk.toFixed(2)} Lakh${lk > 1 ? 's' : ''}`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

