import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Institution } from '../models/Institution.model';
import { Requirement } from '../models/Requirement.model';
import { Fdr, IFdr } from '../models/Fdr.model';
import { Approval } from '../models/Approval.model';
import { Discrepancy } from '../models/Discrepancy.model';
import { DocumentRecord } from '../models/Document.model';
import { DEFAULT_VERIFICATION_CHECKLIST } from '../modules/verifications/verification.service';

async function seedFdrsVerificationsAndApprovals() {
  console.log('\n============================================================');
  console.log('📑 AICTE PORTAL: SEEDING FDR REGISTRY, VERIFICATIONS & APPROVALS');
  console.log('============================================================\n');

  try {
    await connectDatabase();

    const institutions = await Institution.find().lean();
    const requirements = await Requirement.find().lean();

    if (institutions.length === 0 || requirements.length === 0) {
      console.error('❌ Please run `npm run seed:institutions` first to seed institutions & requirements!');
      process.exit(1);
    }

    const instMap = new Map(institutions.map((i) => [i.code, i]));
    const reqMap = new Map(requirements.map((r) => [r.requirementId, r]));

    const today = new Date();
    const fiveYearsLater = new Date();
    fiveYearsLater.setFullYear(today.getFullYear() + 5);

    // List of 15 authentic FDR instruments
    const fdrSeedDefinitions = [
      {
        fdrId: 'FDR-2026-INST-CEG-001-01',
        instCode: 'INST-CEG-001',
        reqId: 'REQ-2026-INST-CEG-001-01',
        fdrNumber: 'SBI-FDR-2026-9901',
        bankName: 'State Bank of India',
        bankBranch: 'Guindy Corporate Branch, Chennai - 600025',
        depositAmount: '5000000.00',
        interestRate: 7.25,
        submissionStatus: 'APPROVED' as const,
        verificationStatus: 'VERIFIED' as const,
        isDuplicate: false,
        remarks: 'Statutory lien verified by AICTE Regional Office Chennai',
        approvalStatus: 'APPROVED' as const,
      },
      {
        fdrId: 'FDR-2026-INST-PSG-002-01',
        instCode: 'INST-PSG-002',
        reqId: 'REQ-2026-INST-PSG-002-01',
        fdrNumber: 'PNB-FDR-2026-4412',
        bankName: 'Punjab National Bank',
        bankBranch: 'Peelamedu Branch, Coimbatore - 641004',
        depositAmount: '3500000.00',
        interestRate: 7.15,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'UNDER_SCRUTINY' as const,
        isDuplicate: false,
        remarks: 'Certificate scan under scrutiny by Verification Officer',
        approvalStatus: 'PENDING' as const,
      },
      {
        fdrId: 'FDR-2026-INST-TCE-003-01',
        instCode: 'INST-TCE-003',
        reqId: 'REQ-2026-INST-TCE-003-01',
        fdrNumber: 'CAN-FDR-2026-1189',
        bankName: 'Canara Bank',
        bankBranch: 'Tiruparankundram Road Branch, Madurai - 625015',
        depositAmount: '4000000.00',
        interestRate: 7.30,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'PENDING' as const,
        isDuplicate: false,
        remarks: 'Submitted for verification desk checklist scrutiny',
        approvalStatus: 'PENDING' as const,
      },
      {
        fdrId: 'FDR-2026-INST-CIT-004-01',
        instCode: 'INST-CIT-004',
        reqId: 'REQ-2026-INST-CIT-004-01',
        fdrNumber: 'IND-FDR-2026-6632',
        bankName: 'Indian Bank',
        bankBranch: 'Civil Aerodrome Post Branch, Coimbatore - 641014',
        depositAmount: '3000000.00',
        interestRate: 7.20,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'PENDING' as const,
        isDuplicate: false,
        remarks: 'Awaiting primary scrutiny checklist confirmation',
        approvalStatus: 'PENDING' as const,
      },
      {
        fdrId: 'FDR-2026-INST-VIT-005-01',
        instCode: 'INST-VIT-005',
        reqId: 'REQ-2026-INST-VIT-005-01',
        fdrNumber: 'HDFC-FDR-2026-7781',
        bankName: 'HDFC Bank',
        bankBranch: 'Katpadi Branch, Vellore - 632014',
        depositAmount: '6000000.00',
        interestRate: 7.50,
        submissionStatus: 'APPROVED' as const,
        verificationStatus: 'VERIFIED' as const,
        isDuplicate: false,
        remarks: 'Joint lien verified and endorsed by Regional Approving Authority',
        approvalStatus: 'APPROVED' as const,
      },
      {
        fdrId: 'FDR-2026-INST-GCT-006-01',
        instCode: 'INST-GCT-006',
        reqId: 'REQ-2026-INST-GCT-006-01',
        fdrNumber: 'BOB-FDR-2026-3390',
        bankName: 'Bank of Baroda',
        bankBranch: 'Thadagam Road Branch, Coimbatore - 641013',
        depositAmount: '2500000.00',
        interestRate: 7.10,
        submissionStatus: 'RETURNED_FOR_CORRECTION' as const,
        verificationStatus: 'UNDER_SCRUTINY' as const,
        isDuplicate: false,
        remarks: 'Joint account title missing explicit designation of Regional Officer AICTE. Please re-endorse.',
        approvalStatus: 'RETURNED' as const,
        discrepancy: {
          type: 'NAME_MISMATCH' as const,
          severity: 'HIGH' as const,
          title: 'Account Holder Joint Designation Deficient',
          description: 'The bank FDR certificate lists principal as college trust only without RO AICTE joint endorsement.',
        },
      },
      {
        fdrId: 'FDR-2026-INST-NITT-007-01',
        instCode: 'INST-NITT-007',
        reqId: 'REQ-2026-INST-NITT-007-01',
        fdrNumber: 'SBI-FDR-2026-5521',
        bankName: 'State Bank of India',
        bankBranch: 'NIT Campus Branch, Thuvakudi, Tiruchirappalli - 620015',
        depositAmount: '7500000.00',
        interestRate: 7.45,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'UNDER_SCRUTINY' as const,
        isDuplicate: false,
        remarks: 'Primary officer checklist verified; awaiting Senior Officer confirmation',
        approvalStatus: 'PENDING' as const,
      },
      {
        fdrId: 'FDR-2026-INST-SSN-008-01',
        instCode: 'INST-SSN-008',
        reqId: 'REQ-2026-INST-SSN-008-01',
        fdrNumber: 'AXIS-FDR-2026-8841',
        bankName: 'Axis Bank',
        bankBranch: 'Kalavakkam OMR Branch, Chengalpattu - 603110',
        depositAmount: '3000000.00',
        interestRate: 7.35,
        submissionStatus: 'APPROVED' as const,
        verificationStatus: 'VERIFIED' as const,
        isDuplicate: false,
        remarks: 'Fully certified and compliant with statutory regulations',
        approvalStatus: 'APPROVED' as const,
      },
      {
        fdrId: 'FDR-2026-INST-MIT-009-01',
        instCode: 'INST-MIT-009',
        reqId: 'REQ-2026-INST-MIT-009-01',
        fdrNumber: 'IOB-FDR-2026-2244',
        bankName: 'Indian Overseas Bank',
        bankBranch: 'Chromepet Branch, Chennai - 600044',
        depositAmount: '4000000.00',
        interestRate: 7.20,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'PENDING' as const,
        isDuplicate: false,
        remarks: 'Dispatched to AICTE Southern Regional Office Verification Desk',
        approvalStatus: 'PENDING' as const,
      },
      {
        fdrId: 'FDR-2026-INST-KCT-010-01',
        instCode: 'INST-KCT-010',
        reqId: 'REQ-2026-INST-KCT-010-01',
        fdrNumber: 'KVB-FDR-2026-4491',
        bankName: 'Karur Vysya Bank',
        bankBranch: 'Chinnavedampatti Branch, Coimbatore - 641049',
        depositAmount: '3500000.00',
        interestRate: 7.30,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'UNDER_SCRUTINY' as const,
        isDuplicate: false,
        remarks: 'Scanned receipt has partial resolution blur on bank seal',
        approvalStatus: 'PENDING' as const,
        discrepancy: {
          type: 'DOCUMENT_ILLEGIBLE' as const,
          severity: 'MEDIUM' as const,
          title: 'Official Bank Seal Partially Obscured',
          description: 'The uploaded PDF document scan contains motion blur on the issuing officer seal signature.',
        },
      },
      {
        fdrId: 'FDR-2026-INST-NITT-007-02',
        instCode: 'INST-NITT-007',
        reqId: 'REQ-2026-INST-NITT-007-02',
        fdrNumber: 'SBI-FDR-2026-5521', // Duplicate certificate number deliberately flagged
        bankName: 'State Bank of India',
        bankBranch: 'NIT Campus Branch, Tiruchirappalli - 620015',
        depositAmount: '5000000.00',
        interestRate: 7.45,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'UNDER_SCRUTINY' as const,
        isDuplicate: true,
        duplicateNotes: 'Duplicate Instrument: Certificate No. SBI-FDR-2026-5521 already pledged for Semiconductor Fab mandate.',
        remarks: 'System flagged duplicate instrument number during OCR intake',
        approvalStatus: 'RETURNED' as const,
        discrepancy: {
          type: 'DUPLICATE_SUSPECT' as const,
          severity: 'CRITICAL' as const,
          title: 'Duplicate Certificate Number Registered Across Mandates',
          description: 'Instrument Certificate SBI-FDR-2026-5521 matches active pledged deposit in Requirement REQ-2026-INST-NITT-007-01.',
        },
      },
      {
        fdrId: 'FDR-2026-INST-CEG-001-02',
        instCode: 'INST-CEG-001',
        reqId: 'REQ-2026-INST-CEG-001-02',
        fdrNumber: 'SBI-FDR-2026-9902',
        bankName: 'State Bank of India',
        bankBranch: 'Guindy Corporate Branch, Chennai - 600025',
        depositAmount: '2500000.00',
        interestRate: 7.25,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'PENDING' as const,
        isDuplicate: false,
        remarks: 'Queued for AI OCR integrity verification check',
        approvalStatus: 'PENDING' as const,
      },
      {
        fdrId: 'FDR-2026-INST-PSG-002-02',
        instCode: 'INST-PSG-002',
        reqId: 'REQ-2026-INST-PSG-002-02',
        fdrNumber: 'PNB-FDR-2026-4413',
        bankName: 'Punjab National Bank',
        bankBranch: 'Peelamedu Branch, Coimbatore - 641004',
        depositAmount: '2000000.00',
        interestRate: 7.15,
        submissionStatus: 'APPROVED' as const,
        verificationStatus: 'VERIFIED' as const,
        isDuplicate: false,
        remarks: 'Annual research escrow deposit fulfilled in full compliance',
        approvalStatus: 'APPROVED' as const,
      },
      {
        fdrId: 'FDR-2026-INST-VIT-005-02',
        instCode: 'INST-VIT-005',
        reqId: 'REQ-2026-INST-VIT-005-02',
        fdrNumber: 'HDFC-FDR-2026-7782',
        bankName: 'HDFC Bank',
        bankBranch: 'Katpadi Branch, Vellore - 632014',
        depositAmount: '4500000.00',
        interestRate: 7.50,
        submissionStatus: 'SUBMITTED' as const,
        verificationStatus: 'UNDER_SCRUTINY' as const,
        isDuplicate: false,
        remarks: 'International program collaborative deposit escalated for legal advisory review',
        approvalStatus: 'ESCALATED' as const,
      },
      {
        fdrId: 'FDR-2026-INST-SSN-008-02',
        instCode: 'INST-SSN-008',
        reqId: 'REQ-2026-INST-SSN-008-02',
        fdrNumber: 'AXIS-FDR-2026-8842',
        bankName: 'Axis Bank',
        bankBranch: 'Kalavakkam OMR Branch, Chennai - 603110',
        depositAmount: '2000000.00',
        interestRate: 7.35,
        submissionStatus: 'DRAFT' as const,
        verificationStatus: 'PENDING' as const,
        isDuplicate: false,
        remarks: 'Draft instrument created by institution finance desk',
        approvalStatus: null,
      },
    ];

    let seededFdrsCount = 0;
    let seededApprovalsCount = 0;
    let seededDiscrepanciesCount = 0;

    for (let i = 0; i < fdrSeedDefinitions.length; i++) {
      const def = fdrSeedDefinitions[i];
      const inst = instMap.get(def.instCode);
      const req = reqMap.get(def.reqId);

      if (!inst || !req) {
        console.warn(`Skipping FDR ${def.fdrId}: matching institution or requirement not found.`);
        continue;
      }

      const holderName = `Joint Account: ${inst.name} & Regional Officer, AICTE`;

      // 1. Prepare checklist with realistic progress
      const checklist = DEFAULT_VERIFICATION_CHECKLIST.map((item) => {
        if (def.verificationStatus === 'VERIFIED') {
          return {
            ...item,
            status: 'PASS' as const,
            comments: 'Verified in full compliance with AICTE guidelines',
            verifiedAt: today,
            verifiedBy: 'AICTE Verification Officer Chennai',
          };
        } else if (def.verificationStatus === 'UNDER_SCRUTINY') {
          // Half pass, half pending
          const passKeys = ['INSTITUTION_INFO', 'BANK_INFO', 'DEPOSIT_AMOUNT', 'HOLDER_NAME'];
          return {
            ...item,
            status: passKeys.includes(item.itemKey) ? ('PASS' as const) : ('PENDING' as const),
            comments: passKeys.includes(item.itemKey) ? 'Validated against scheduled bank records' : undefined,
            verifiedAt: passKeys.includes(item.itemKey) ? today : undefined,
            verifiedBy: passKeys.includes(item.itemKey) ? 'AICTE Verification Officer' : undefined,
          };
        }
        return { ...item, status: 'PENDING' as const };
      });

      // 2. Upsert FDR Record
      const fdrDoc = await Fdr.findOneAndUpdate(
        { fdrId: def.fdrId },
        {
          $set: {
            fdrId: def.fdrId,
            institutionId: inst.code,
            institutionName: inst.name,
            requirementId: req.requirementId,
            requirementTitle: req.title,
            instrumentType: 'FDR',
            bankName: def.bankName,
            bankBranch: def.bankBranch,
            fdrNumber: def.fdrNumber,
            holderName,
            depositAmount: mongoose.Types.Decimal128.fromString(def.depositAmount),
            issueDate: today,
            maturityDate: fiveYearsLater,
            currency: 'INR',
            isJointAccount: true,
            autoRenewal: true,
            interestRate: def.interestRate,
            submissionStatus: def.submissionStatus,
            verificationStatus: def.verificationStatus,
            lifecycleStatus: 'ACTIVE',
            isDuplicateFlagged: def.isDuplicate,
            duplicateReviewNotes: def.duplicateNotes,
            remarks: def.remarks,
            verificationRemarks: def.verificationStatus === 'VERIFIED' ? 'Statutory joint lien verified' : undefined,
            verificationChecklist: checklist,
            createdBy: 'College Authorized Representative',
            submittedAt: today,
            verifiedAt: def.verificationStatus === 'VERIFIED' ? today : undefined,
            verifiedBy: def.verificationStatus === 'VERIFIED' ? 'AICTE Regional Scrutiny Officer' : undefined,
            documentReferences: [`DOC-${def.fdrId}-01`, `DOC-${def.fdrId}-02`],
          },
          $setOnInsert: {
            history: [
              {
                action: 'REGISTERED',
                performedBy: 'College Finance Officer',
                performedByEmail: inst.contactEmail,
                details: `Registered Fixed Deposit Receipt [${def.fdrNumber}] with ${def.bankName}`,
                timestamp: today,
              },
            ],
          },
        },
        { upsert: true, new: true }
      );

      seededFdrsCount++;
      console.log(`[${i + 1}/15] 📑 FDR: [${fdrDoc.fdrId}] ${fdrDoc.bankName} (₹${Number(def.depositAmount).toLocaleString('en-IN')}) — ${def.submissionStatus} / ${def.verificationStatus}`);

      // 3. Seed Associated Document Records
      const docTypes = ['FDR_RECEIPT', 'BANK_CONFIRMATION_LETTER'] as const;
      for (let d = 0; d < docTypes.length; d++) {
        const docId = `DOC-${def.fdrId}-0${d + 1}`;
        await DocumentRecord.findOneAndUpdate(
          { documentId: docId },
          {
            $set: {
              documentId: docId,
              instrumentId: fdrDoc.fdrId,
              institutionId: inst.code,
              documentType: docTypes[d],
              originalFileName: `${def.bankName.replace(/\s+/g, '_')}_${docTypes[d]}_Certificate.pdf`,
              storageKey: `/documents/${inst.code}/${def.fdrId}/${docId}.pdf`,
              mimeType: 'application/pdf',
              fileSize: 245800 + d * 52000,
              fileHash: `hash-${def.fdrId}-${d + 1}`,
              uploadedBy: 'College Representative',
              uploadedByEmail: inst.contactEmail,
              uploadedAt: today,
              verificationStatus: def.verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
              cloudinaryUrl: 'https://res.cloudinary.com/uoyjkcmp/image/upload/sample_fdr_statutory_cert.pdf',
            },
          },
          { upsert: true }
        );
      }

      // 4. Seed Open Discrepancy if applicable (for Verification Desk -> Discrepancies Tab)
      if (def.discrepancy) {
        const discId = `DISC-2026-${def.instCode}-${i + 1}`;
        await Discrepancy.findOneAndUpdate(
          { discrepancyId: discId },
          {
            $set: {
              discrepancyId: discId,
              instrumentId: fdrDoc.fdrId,
              institutionId: inst.code,
              institutionName: inst.name,
              requirementId: req.requirementId,
              discrepancyType: def.discrepancy.type,
              title: def.discrepancy.title,
              description: def.discrepancy.description,
              severity: def.discrepancy.severity,
              createdBy: 'AICTE Verification Officer',
              createdByName: 'Regional Scrutiny Officer',
              resolutionStatus: 'OPEN',
            },
          },
          { upsert: true }
        );
        seededDiscrepanciesCount++;
        console.log(`     ⚠️  Discrepancy Logged: [${discId}] ${def.discrepancy.severity} — ${def.discrepancy.title}`);
      }

      // 5. Seed Approval Workflow if applicable (for Approval Center)
      if (def.approvalStatus) {
        const approvalId = `APP-2026-${def.fdrId}`;
        const isApproved = def.approvalStatus === 'APPROVED';

        const steps = [
          {
            stepNumber: 1,
            title: 'Scrutiny Officer Initial Endorsement',
            roleRequired: 'VERIFICATION_OFFICER',
            assignedApproverEmail: 'officer.chennai@aicte-india.org',
            status: isApproved ? ('APPROVED' as const) : ('APPROVED' as const),
            actionBy: 'Shri R. Sundaram (Verification Officer)',
            actionByEmail: 'officer.chennai@aicte-india.org',
            actionDate: today,
            remarks: 'Instrument particulars cross-checked against scheduled bank confirmation letter.',
          },
          {
            stepNumber: 2,
            title: 'Regional Officer Final Statutory Approval',
            roleRequired: 'APPROVING_AUTHORITY',
            assignedApproverEmail: 'ro.chennai@aicte-india.org',
            status: isApproved
              ? ('APPROVED' as const)
              : def.approvalStatus === 'RETURNED'
              ? ('RETURNED' as const)
              : def.approvalStatus === 'ESCALATED'
              ? ('ESCALATED' as const)
              : ('PENDING' as const),
            actionBy: isApproved ? 'Dr. M. Senthil Nathan (Regional Officer)' : undefined,
            actionByEmail: isApproved ? 'ro.chennai@aicte-india.org' : undefined,
            actionDate: isApproved ? today : undefined,
            remarks: isApproved
              ? 'Final statutory compliance order issued; institution status confirmed.'
              : def.approvalStatus === 'ESCALATED'
              ? 'Escalated to Central Legal Advisory Bureau for joint international collaboration verification.'
              : 'Awaiting executive sign-off from Regional Officer desk.',
          },
        ];

        await Approval.findOneAndUpdate(
          { approvalId },
          {
            $set: {
              approvalId,
              instrumentId: fdrDoc.fdrId,
              institutionId: inst.code,
              institutionName: inst.name,
              requirementId: req.requirementId,
              requirementTitle: req.title,
              workflowType: 'FDR_REGISTRATION',
              requestedBy: inst.administratorName || 'College Principal',
              requestedByEmail: inst.contactEmail,
              requestedByName: inst.administratorName || 'College Principal',
              amount: mongoose.Types.Decimal128.fromString(def.depositAmount),
              currentStep: isApproved ? 2 : 2,
              totalSteps: 2,
              status: def.approvalStatus,
              steps,
              isCompleted: isApproved,
              completedAt: isApproved ? today : undefined,
              finalDecision: isApproved ? 'APPROVED' : undefined,
            },
            $setOnInsert: {
              approvalHistory: [
                {
                  action: 'SUBMITTED',
                  stepNumber: 1,
                  performedBy: 'College Finance Officer',
                  performedByEmail: inst.contactEmail,
                  remarks: 'Registration submitted for multi-tier regulatory approval',
                  timestamp: today,
                },
              ],
            },
          },
          { upsert: true }
        );
        seededApprovalsCount++;
        console.log(`     🏆 Approval Workflow: [${approvalId}] Status: [${def.approvalStatus}]`);
      }

      // 6. Update Requirement Pledged Instruments Array
      await Requirement.updateOne(
        { requirementId: req.requirementId },
        {
          $addToSet: {
            pledgedInstruments: {
              instrumentId: fdrDoc.fdrId,
              instrumentType: 'FDR',
              bankName: fdrDoc.bankName,
              branchName: fdrDoc.bankBranch,
              amount: fdrDoc.depositAmount,
              maturityDate: fdrDoc.maturityDate,
              verificationStatus: def.verificationStatus,
              isJointAccount: true,
              pledgedAt: today,
              remarks: def.remarks,
            },
          },
        }
      );
    }

    console.log('\n============================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`✅ Total FDRs in Registry: ${await Fdr.countDocuments()}`);
    console.log(`✅ Total Verifications Pending/Scrutiny: ${await Fdr.countDocuments({ verificationStatus: { $in: ['PENDING', 'UNDER_SCRUTINY'] } })}`);
    console.log(`✅ Total Open Discrepancies: ${await Discrepancy.countDocuments({ resolutionStatus: 'OPEN' })}`);
    console.log(`✅ Total Approval Center Requests: ${await Approval.countDocuments()}`);
    console.log('============================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED WITH ERROR:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedFdrsVerificationsAndApprovals();
