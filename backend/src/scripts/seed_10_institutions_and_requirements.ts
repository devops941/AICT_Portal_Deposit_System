import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Institution, IInstitution, InstitutionType } from '../models/Institution.model';
import { Requirement, IRequirement, RequirementType } from '../models/Requirement.model';
import { logger } from '../config/logger';

interface InstitutionSeedData {
  name: string;
  code: string;
  aicteId: string;
  institutionType: InstitutionType;
  address: string;
  state: string;
  district: string;
  pincode: string;
  contactEmail: string;
  contactPhone: string;
  administratorName: string;
  requirements: Array<{
    title: string;
    requirementType: RequirementType;
    requiredAmount: string;
    ruleRef: string;
  }>;
}

const SEED_DATA: InstitutionSeedData[] = [
  {
    name: 'College of Engineering, Guindy (Anna University)',
    code: 'INST-CEG-001',
    aicteId: '1-100200301',
    institutionType: 'STATE_UNIVERSITY',
    address: '12 Sardar Patel Road, Guindy',
    state: 'Tamil Nadu',
    district: 'Chennai',
    pincode: '600025',
    contactEmail: 'deanceg@annauniv.edu',
    contactPhone: '+91-44-2235-8491',
    administratorName: 'Dr. L. Suganthi',
    requirements: [
      {
        title: 'Security Deposit for AICTE New Technical Program Approval 2026-27',
        requirementType: 'NEW_INSTITUTION_ESTABLISHMENT',
        requiredAmount: '5000000.00',
        ruleRef: 'AICTE Approval Process Handbook (APH) 2026-27, Chapter IV, Clause 4.1',
      },
      {
        title: 'Statutory Deposit for AI & Data Science Department Expansion',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '2500000.00',
        ruleRef: 'AICTE APH 2026-27, Norms for Emerging Area Program Augmentation',
      },
    ],
  },
  {
    name: 'PSG College of Technology',
    code: 'INST-PSG-002',
    aicteId: '1-100200302',
    institutionType: 'AUTONOMOUS_INSTITUTE',
    address: 'Post Box No. 1611, Peelamedu',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    pincode: '641004',
    contactEmail: 'principal@psgtech.edu',
    contactPhone: '+91-422-257-2177',
    administratorName: 'Dr. K. Prakasan',
    requirements: [
      {
        title: 'Mandatory Security Deposit for Robotics & Automation PG Program',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '3500000.00',
        ruleRef: 'AICTE APH 2026-27, Clause 4.2.2 (Advanced PG Technical Programs)',
      },
      {
        title: 'Annual Statutory Escrow for Research Facility Infrastructure',
        requirementType: 'ANNUAL_COMPLIANCE',
        requiredAmount: '2000000.00',
        ruleRef: 'AICTE Statutory Compliance Standards (Research & Innovation Labs)',
      },
    ],
  },
  {
    name: 'Thiagarajar College of Engineering',
    code: 'INST-TCE-003',
    aicteId: '1-100200303',
    institutionType: 'GOVT_AIDED_COLLEGE',
    address: 'Tiruparankundram Road',
    state: 'Tamil Nadu',
    district: 'Madurai',
    pincode: '625015',
    contactEmail: 'principal@tce.edu',
    contactPhone: '+91-452-248-2240',
    administratorName: 'Dr. M. Palaninatha Raja',
    requirements: [
      {
        title: 'Statutory Security Deposit for Architecture & Planning Division',
        requirementType: 'NEW_INSTITUTION_ESTABLISHMENT',
        requiredAmount: '4000000.00',
        ruleRef: 'Council of Architecture & AICTE Joint Guidelines 2026-27',
      },
      {
        title: 'Escrow Guarantee for Technical Laboratory Upgradation',
        requirementType: 'ANNUAL_COMPLIANCE',
        requiredAmount: '1500000.00',
        ruleRef: 'AICTE Mandatory Endowment & Equipment Security Norms',
      },
    ],
  },
  {
    name: 'Coimbatore Institute of Technology (CIT)',
    code: 'INST-CIT-004',
    aicteId: '1-100200304',
    institutionType: 'GOVT_AIDED_COLLEGE',
    address: 'Avinashi Road, Civil Aerodrome Post',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    pincode: '641014',
    contactEmail: 'principal@cit.edu.in',
    contactPhone: '+91-422-257-4071',
    administratorName: 'Dr. A. Rajeswari',
    requirements: [
      {
        title: 'Security Deposit for Mechanical & Mechatronics Intake Enhancement',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '3000000.00',
        ruleRef: 'AICTE APH 2026-27, Chapter II, Division Expansion Security Mandate',
      },
      {
        title: 'Annual Statutory Deposit for EV Battery Testing & Powertrain Lab',
        requirementType: 'ANNUAL_COMPLIANCE',
        requiredAmount: '2000000.00',
        ruleRef: 'AICTE Clean Mobility & Green Tech Infrastructure Guidelines',
      },
    ],
  },
  {
    name: 'Vellore Institute of Technology (VIT)',
    code: 'INST-VIT-005',
    aicteId: '1-100200305',
    institutionType: 'DEEMED_TO_BE_UNIVERSITY',
    address: 'Katpadi, Tiruvalam Road',
    state: 'Tamil Nadu',
    district: 'Vellore',
    pincode: '632014',
    contactEmail: 'registrar@vit.ac.in',
    contactPhone: '+91-416-224-3091',
    administratorName: 'Dr. K. Sathiyanarayanan',
    requirements: [
      {
        title: 'Mandatory Security Deposit for Cyber-Physical Systems School',
        requirementType: 'NEW_INSTITUTION_ESTABLISHMENT',
        requiredAmount: '6000000.00',
        ruleRef: 'AICTE Norms for Deemed Universities Establishing New Schools',
      },
      {
        title: 'Statutory Deposit for International Joint Degree Program Approval',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '4500000.00',
        ruleRef: 'AICTE APH 2026-27, Chapter V, Collaboration with Foreign Universities',
      },
    ],
  },
  {
    name: 'Government College of Technology (GCT)',
    code: 'INST-GCT-006',
    aicteId: '1-100200306',
    institutionType: 'GOVT_ENGINEERING_COLLEGE',
    address: 'Thadagam Road',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    pincode: '641013',
    contactEmail: 'principal@gct.ac.in',
    contactPhone: '+91-422-243-2221',
    administratorName: 'Dr. K. Manonmani',
    requirements: [
      {
        title: 'Statutory Deposit for Renewable Energy Center Establishment',
        requirementType: 'NEW_INSTITUTION_ESTABLISHMENT',
        requiredAmount: '2500000.00',
        ruleRef: 'AICTE Norms for Government Institutions New Specialized Centers',
      },
      {
        title: 'Compliance Mandate for Environmental Engineering Research Wing',
        requirementType: 'ANNUAL_COMPLIANCE',
        requiredAmount: '1500000.00',
        ruleRef: 'AICTE Approval Process Handbook Clause 4.3 (Annual Escrow)',
      },
    ],
  },
  {
    name: 'National Institute of Technology, Tiruchirappalli (NIT-T)',
    code: 'INST-NITT-007',
    aicteId: '1-100200307',
    institutionType: 'CENTRAL_UNIVERSITY',
    address: 'Tanjore Main Road, National Highway 67',
    state: 'Tamil Nadu',
    district: 'Tiruchirappalli',
    pincode: '620015',
    contactEmail: 'director@nitt.edu',
    contactPhone: '+91-431-250-3001',
    administratorName: 'Dr. G. Aghila',
    requirements: [
      {
        title: 'Security Deposit for Advanced Semiconductor Fab Training Center',
        requirementType: 'NEW_INSTITUTION_ESTABLISHMENT',
        requiredAmount: '7500000.00',
        ruleRef: 'India Semiconductor Mission & AICTE Joint Technical Escrow Policy',
      },
      {
        title: 'Statutory Deposit for Quantum Computing Department Inception',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '5000000.00',
        ruleRef: 'AICTE APH 2026-27, Advanced Computing Special Mandate',
      },
    ],
  },
  {
    name: 'SSN College of Engineering',
    code: 'INST-SSN-008',
    aicteId: '1-100200308',
    institutionType: 'SELF_FINANCING_PRIVATE',
    address: 'Rajiv Gandhi Salai (OMR), Kalavakkam',
    state: 'Tamil Nadu',
    district: 'Chengalpattu',
    pincode: '603110',
    contactEmail: 'principal@ssn.edu.in',
    contactPhone: '+91-44-2746-9700',
    administratorName: 'Dr. V. E. Annamalai',
    requirements: [
      {
        title: 'Mandatory Security Deposit for Biomedical Engineering Program',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '3000000.00',
        ruleRef: 'AICTE APH 2026-27, Interdisciplinary Healthcare Tech Norms',
      },
      {
        title: 'Statutory Deposit for Autonomous Status Extension & Renewal',
        requirementType: 'ANNUAL_COMPLIANCE',
        requiredAmount: '2000000.00',
        ruleRef: 'UGC-AICTE Autonomous Institution Security Regulations',
      },
    ],
  },
  {
    name: 'Madras Institute of Technology (MIT Campus)',
    code: 'INST-MIT-009',
    aicteId: '1-100200309',
    institutionType: 'STATE_UNIVERSITY',
    address: 'MIT Road, Radha Nagar, Chromepet',
    state: 'Tamil Nadu',
    district: 'Chennai',
    pincode: '600044',
    contactEmail: 'dean@mitindia.edu',
    contactPhone: '+91-44-2223-2403',
    administratorName: 'Dr. J. Prakash',
    requirements: [
      {
        title: 'Security Deposit for Aerospace & Avionics Hangar Expansion',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '4000000.00',
        ruleRef: 'DGCA & AICTE Joint Aeronautical Training Infrastructure Requirements',
      },
      {
        title: 'Statutory Escrow Deposit for Drone Technology Pilot Project',
        requirementType: 'NEW_INSTITUTION_ESTABLISHMENT',
        requiredAmount: '2500000.00',
        ruleRef: 'National Drone Policy & AICTE Advanced Aviation Directives',
      },
    ],
  },
  {
    name: 'Kumaraguru College of Technology (KCT)',
    code: 'INST-KCT-010',
    aicteId: '1-100200310',
    institutionType: 'AUTONOMOUS_INSTITUTE',
    address: 'Athipalayam Road, Chinnavedampatti',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    pincode: '641049',
    contactEmail: 'principal@kct.ac.in',
    contactPhone: '+91-422-266-9401',
    administratorName: 'Dr. D. Saravanan',
    requirements: [
      {
        title: 'Mandatory Security Deposit for Mechatronics & Industry 4.0 Lab',
        requirementType: 'PROGRAM_EXPANSION',
        requiredAmount: '3500000.00',
        ruleRef: 'AICTE APH 2026-27, Industry 4.0 Center of Excellence Guidelines',
      },
      {
        title: 'Statutory Deposit for Additional Course Approval in Cloud Computing',
        requirementType: 'ADDITIONAL_COURSE_INSPECTION',
        requiredAmount: '2000000.00',
        ruleRef: 'AICTE Regulations for Additional Course Sanctions & Escrow Hold',
      },
    ],
  },
];

async function seedInstitutionsAndRequirements() {
  console.log('\n============================================================');
  console.log('🏛️  AICTE PORTAL: SEEDING 10 INSTITUTIONS & 20 REQUIREMENTS');
  console.log('============================================================\n');

  try {
    await connectDatabase();

    const createdInstitutions: string[] = [];
    const createdRequirements: string[] = [];

    for (let i = 0; i < SEED_DATA.length; i++) {
      const data = SEED_DATA[i];

      // 1. Upsert Institution
      const instPayload = {
        name: data.name,
        code: data.code,
        aicteId: data.aicteId,
        institutionType: data.institutionType,
        address: data.address,
        state: data.state,
        district: data.district,
        pincode: data.pincode,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        administratorName: data.administratorName,
        registrationStatus: 'REGISTERED' as const,
        verificationStatus: 'VERIFIED' as const,
        status: 'ACTIVE' as const,
      };

      const institution = await Institution.findOneAndUpdate(
        { code: data.code },
        {
          $set: instPayload,
          $setOnInsert: {
            activityHistory: [
              {
                action: 'SEEDED',
                performedBy: 'System Administrator',
                performedByEmail: 'admin@gmail.com',
                details: `Seeded accredited institution [${data.name}]`,
                timestamp: new Date(),
              },
            ],
            documents: [],
          },
        },
        { upsert: true, new: true }
      );

      createdInstitutions.push(`${institution.code} — ${institution.name}`);
      console.log(`[${i + 1}/10] ✅ Institution Verified: [${institution.code}] ${institution.name}`);

      // 2. Upsert 2 Security Deposit Requirements for this Institution
      for (let j = 0; j < data.requirements.length; j++) {
        const reqDef = data.requirements[j];
        const reqId = `REQ-2026-${data.code}-${String(j + 1).padStart(2, '0')}`;

        const effectiveDate = new Date();
        effectiveDate.setMonth(0, 1); // 1st Jan 2026

        const submissionDeadline = new Date();
        submissionDeadline.setFullYear(effectiveDate.getFullYear() + 1);
        submissionDeadline.setMonth(5, 30); // 30th June 2027

        const reqPayload = {
          requirementId: reqId,
          institutionId: data.code,
          institutionName: data.name,
          title: reqDef.title,
          requirementType: reqDef.requirementType,
          requiredAmount: mongoose.Types.Decimal128.fromString(reqDef.requiredAmount),
          currency: 'INR',
          effectiveDate,
          submissionDeadline,
          applicableRuleReference: reqDef.ruleRef,
          acceptableInstrumentTypes: ['FDR', 'BANK_GUARANTEE', 'DEMAND_DRAFT', 'GOVERNMENT_BOND'],
          supportingDocumentRequirements: [
            'FDR_RECEIPT',
            'BANK_CONFIRMATION_LETTER',
            'BOARD_RESOLUTION',
            'SFMS_ADVICE',
          ],
          applicableBusinessRules: [
            'JOINT_ACCOUNT_WITH_RO_AICTE',
            'MINIMUM_5_YEAR_TENURE',
            'AUTO_RENEWAL_CLAUSE_MANDATORY',
            'SCHEDULED_COMMERCIAL_BANK_ONLY',
          ],
          requirementStatus: 'ACTIVE' as const,
          complianceStatus: 'NOT_SUBMITTED' as const,
          createdBy: 'AICTE Statutory Approvals Bureau',
        };

        const requirement = await Requirement.findOneAndUpdate(
          { requirementId: reqId },
          {
            $set: reqPayload,
            $setOnInsert: {
              pledgedInstruments: [],
              activityHistory: [
                {
                  action: 'SEEDED_STATUTORY_REQUIREMENT',
                  performedBy: 'System Administrator',
                  performedByEmail: 'admin@gmail.com',
                  details: `Statutory deposit mandate seeded for ${data.name}`,
                  timestamp: new Date(),
                },
              ],
            },
          },
          { upsert: true, new: true }
        );

        createdRequirements.push(
          `  ↳ Req ${j + 1}: [${requirement.requirementId}] ₹${Number(reqDef.requiredAmount).toLocaleString('en-IN')} — ${requirement.title}`
        );
        console.log(`     🔹 Requirement ${j + 1}: [${requirement.requirementId}] ₹${Number(reqDef.requiredAmount).toLocaleString('en-IN')} — ${reqDef.title}`);
      }
      console.log('');
    }

    console.log('============================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`✅ Total Institutions in Database: ${await Institution.countDocuments()}`);
    console.log(`✅ Total Requirements in Database: ${await Requirement.countDocuments()}`);
    console.log('============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED WITH ERROR:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedInstitutionsAndRequirements();
