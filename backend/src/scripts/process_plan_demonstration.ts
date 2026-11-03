import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Institution } from '../models/Institution.model';
import { Requirement } from '../models/Requirement.model';
import { Fdr } from '../models/Fdr.model';
import { Approval } from '../models/Approval.model';
import { requirementService } from '../modules/requirements/requirement.service';
import { fdrService } from '../modules/fdrs/fdr.service';
import { verificationService, DEFAULT_VERIFICATION_CHECKLIST } from '../modules/verifications/verification.service';
import { approvalService } from '../modules/approvals/approval.service';
import { FieldExtractionService } from '../modules/ai/extraction.service';
import { DecimalUtils } from '../utils/decimal';
import { AuthUserContext } from '../middleware/auth.middleware';

async function processPlanDemonstration() {
  console.log('\n================================================================================');
  console.log('🏛️  AICTE STATUTORY DEPOSIT & FDR LIFECYCLE: PROCESSING END-TO-END PLAN');
  console.log('================================================================================\n');

  try {
    await connectDatabase();

    // 0. Locate Target Institution: CEG Anna University
    const targetInstitution = await Institution.findOne({ code: 'INST-CEG-001' });
    if (!targetInstitution) {
      throw new Error("Target institution 'INST-CEG-001' not found. Run seed script first.");
    }
    console.log(`[INSTITUTION] Located: ${targetInstitution.name} (${targetInstitution.code})`);

    // -------------------------------------------------------------------------
    // PHASE 1: AICTE ADMIN DEFINES STATUTORY DEPOSIT REQUIREMENT
    // -------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------');
    console.log('📋 PHASE 1: AICTE ADMIN DEFINES STATUTORY DEPOSIT REQUIREMENT');
    console.log('--------------------------------------------------------------------------------');

    const adminUser: AuthUserContext = {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'gokul@gmail.com',
      fullName: 'Gokul (Lead Administrator)',
      userType: 'ADMIN',
      roles: ['SYSTEM_ADMINISTRATOR'],
      permissions: ['DEPOSITS:CREATE', 'DEPOSITS:UPDATE', 'DEPOSITS:READ'],
    };

    const timestamp = Date.now().toString().slice(-5);
    const customReqId = `REQ-2026-CEG-EXP-${timestamp}`;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 60);

    const createdReq = await requirementService.createRequirement(
      {
        requirementId: customReqId,
        institutionId: targetInstitution.code,
        title: 'Statutory Security Deposit for Establishment of New Technical Campus (AY 2026-27)',
        requirementType: 'NEW_INSTITUTION_ESTABLISHMENT',
        requiredAmount: '5000000.00',
        currency: 'INR',
        effectiveDate: new Date().toISOString(),
        submissionDeadline: deadline.toISOString(),
        applicableRuleReference: 'AICTE Approval Process Handbook (APH) 2026-27, Chapter IV, Section 4.1.2',
        acceptableInstrumentTypes: ['FDR', 'BANK_GUARANTEE'],
        supportingDocumentRequirements: [
          'Tripartite Bank Confirmation Letter with AICTE Lien Endorsement',
          'Copy of Joint Fixed Deposit Receipt (Physical Scan)',
          'Society/Trust Board Resolution authorizing Joint Mandate with Member Secretary AICTE',
        ],
        applicableBusinessRules: [
          'FDR must be drawn jointly in name of Principal CEG & Member Secretary AICTE',
          'Mandatory lock-in tenure: 10 years (120 months) with irrevocable bank lien',
          'Auto-renewal clause must be active at prevailing scheduled interest rates',
        ],
      },
      adminUser
    );

    console.log(`✅ [PHASE 1 SUCCESS] Requirement Created: ${createdReq.requirementId}`);
    console.log(`   Title: ${createdReq.title}`);
    console.log(`   Mandated Deposit: ${DecimalUtils.formatCurrency(createdReq.requiredAmount)}`);
    console.log(`   Statutory Rule: ${createdReq.applicableRuleReference}`);

    // Check Initial Compliance
    const initialCompliance = requirementService.calculateCompliance(createdReq);
    console.log(`   Initial Status: [${initialCompliance.complianceStatus}]`);
    console.log(`   Outstanding Deficit: ${initialCompliance.outstandingShortfallFormatted}`);

    // -------------------------------------------------------------------------
    // PHASE 2: COLLEGE FINANCE STAFF PLEDGES JOINT FDR
    // -------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------');
    console.log('💰 PHASE 2: COLLEGE FINANCE STAFF PLEDGES JOINT FDR');
    console.log('--------------------------------------------------------------------------------');

    const collegeStaffUser: AuthUserContext = {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'finance.ceg@annauniv.edu',
      fullName: 'K. Meenakshi (Finance Section)',
      userType: 'USER',
      roles: ['INSTITUTION_STAFF'],
      permissions: ['FDR:CREATE', 'FDR:READ'],
      institutionId: targetInstitution.code,
    };

    const issueDate = new Date();
    const maturityDate = new Date();
    maturityDate.setFullYear(issueDate.getFullYear() + 10); // 10 years tenure

    const fdrNumber = `SBI-FDR-2026-${timestamp}`;

    const createdFdr = await fdrService.createFdr(
      {
        institutionId: targetInstitution.code,
        requirementId: createdReq.requirementId,
        instrumentType: 'FDR',
        bankName: 'State Bank of India',
        bankBranch: 'Guindy Corporate Branch, Chennai - 600025',
        fdrNumber: fdrNumber,
        holderName: 'Dean CEG & Member Secretary AICTE',
        depositAmount: '5000000.00',
        issueDate: issueDate.toISOString(),
        maturityDate: maturityDate.toISOString(),
        currency: 'INR',
        isJointAccount: true,
        autoRenewal: true,
        interestRate: 7.25,
        remarks: 'Joint Fixed Deposit Receipt pledged under AICTE Approval Process Handbook norms.',
        documentReferences: [`DOC-SCAN-SBI-${timestamp}.pdf`],
      },
      collegeStaffUser
    );

    console.log(`✅ [PHASE 2 SUCCESS] FDR Pledged & Submitted: ${createdFdr.fdrId}`);
    console.log(`   FDR Certificate No: ${createdFdr.fdrNumber}`);
    console.log(`   Joint Account Title: "${createdFdr.holderName}" (isJoint: ${createdFdr.isJointAccount})`);
    console.log(`   Principal Amount: ${DecimalUtils.formatCurrency(createdFdr.depositAmount)}`);
    console.log(`   Tenure: 120 Months (Maturity Date: ${createdFdr.maturityDate.toISOString().split('T')[0]})`);
    console.log(`   Submission Status: [${createdFdr.submissionStatus}] | Verification Status: [${createdFdr.verificationStatus}]`);

    // -------------------------------------------------------------------------
    // PHASE 3: AI DOCUMENT OCR EXTRACTION PRE-CHECK
    // -------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------');
    console.log('🤖 PHASE 3: AI DOCUMENT OCR INTELLIGENCE EXTRACTION');
    console.log('--------------------------------------------------------------------------------');

    const ocrEngine = new FieldExtractionService();
    const simulatedOcrScanText = `
      STATE BANK OF INDIA - GUINDY CORPORATE BRANCH, CHENNAI 600025
      FIXED DEPOSIT RECEIPT / SPECIAL TERM DEPOSIT
      FDR NUMBER: ${fdrNumber}
      ACCOUNT TITLE: DEAN CEG AND MEMBER SECRETARY AICTE (JOINT ACCOUNT)
      PRINCIPAL SUM: RS. 50,00,000.00 (FIFTY LAKHS ONLY)
      ISSUE DATE: ${issueDate.toISOString().split('T')[0]}
      MATURITY DATE: ${maturityDate.toISOString().split('T')[0]}
      INTEREST RATE: 7.25% P.A.
      LIEN MARKING: STATUTORY LIEN MARKED IN FAVOUR OF MEMBER SECRETARY, AICTE.
      AUTO-RENEWAL: ENABLED ON MATURITY.
    `;

    const aiExtraction = ocrEngine.extractFields(simulatedOcrScanText);
    console.log(`✅ [PHASE 3 SUCCESS] AI OCR Parsing Complete (Overall Confidence: ${aiExtraction.overallConfidence}%)`);
    console.log(`   Extracted Bank: "${aiExtraction.bankName.value}" (Confidence: ${aiExtraction.bankName.confidence}%)`);
    console.log(`   Extracted FDR No: "${aiExtraction.fdrNumber.value}" (Confidence: ${aiExtraction.fdrNumber.confidence}%)`);
    console.log(`   Extracted Amount: "${aiExtraction.depositAmount.value}" (Confidence: ${aiExtraction.depositAmount.confidence}%)`);
    console.log(`   Extracted Maturity: "${aiExtraction.maturityDate.value}" (Confidence: ${aiExtraction.maturityDate.confidence}%)`);

    // -------------------------------------------------------------------------
    // PHASE 4: DESK SCRUTINY OFFICER VERIFICATION (10-POINT CHECKLIST)
    // -------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------');
    console.log('🔍 PHASE 4: DESK SCRUTINY OFFICER VERIFICATION & 10-POINT CHECKLIST');
    console.log('--------------------------------------------------------------------------------');

    const scrutinyOfficer: AuthUserContext = {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'ramesh.kumar@aicte-india.org',
      fullName: 'Ramesh Kumar (Desk Scrutiny Officer)',
      userType: 'USER',
      roles: ['VERIFICATION_OFFICER'],
      permissions: ['FDR:VERIFY', 'FDR:READ'],
    };

    // Prepare complete 10-point checklist validated as PASS
    const validatedChecklist = DEFAULT_VERIFICATION_CHECKLIST.map((item) => ({
      itemKey: item.itemKey,
      label: item.label,
      status: 'PASS' as const,
      comments: `Verified authentic and conforming to APH norms by ${scrutinyOfficer.fullName}`,
    }));

    const verificationResult = await verificationService.verifyFdr(
      createdFdr.fdrId,
      {
        checklist: validatedChecklist,
        remarks:
          'The submitted Fixed Deposit Receipt has been thoroughly scrutinized against AICTE Approval Process Handbook (APH 2026-27) norms. The joint endorsement with Member Secretary AICTE, bank lien marking, and 120-month non-encumbrance lock-in are verified in order. Recommended for Executive Director Sanction.',
        initiateApprovalWorkflow: true,
      },
      scrutinyOfficer
    );

    console.log(`✅ [PHASE 4 SUCCESS] FDR Scrutinized and Verified: ${verificationResult.fdr.fdrId}`);
    console.log(`   Verification Status: [${verificationResult.fdr.verificationStatus}]`);
    console.log(`   Checklist Items Validated: 10/10 PASS`);
    console.log(`   Officer Remarks: "${verificationResult.fdr.verificationRemarks}"`);
    console.log(`   Approval Workflow Initiated: ID #${verificationResult.approval?.approvalId}`);

    const approvalId = verificationResult.approval?.approvalId;
    if (!approvalId) {
      throw new Error('Approval workflow ID was not generated!');
    }

    // -------------------------------------------------------------------------
    // PHASE 5: MULTI-TIER EXECUTIVE APPROVAL & DIGITAL SANCTION
    // -------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------');
    console.log('⚖️  PHASE 5: MULTI-TIER EXECUTIVE APPROVAL & DIGITAL SANCTION');
    console.log('--------------------------------------------------------------------------------');

    // Step 1 Approver: Senior Verification Officer (Enforces Separation of Duties from Scrutiny Requester)
    const seniorOfficer: AuthUserContext = {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'ananya.sharma@aicte-india.org',
      fullName: 'Dr. Ananya Sharma (Senior Verification Officer)',
      userType: 'USER',
      roles: ['SENIOR_VERIFICATION_OFFICER', 'VERIFICATION_OFFICER'],
      permissions: ['APPROVALS:EXECUTE', 'FDR:VERIFY'],
    };

    // Step 2 Approver: Regional Director (Final Approving Authority)
    const approvingDirector: AuthUserContext = {
      id: new mongoose.Types.ObjectId().toString(),
      email: 'director.approvals@aicte-india.org',
      fullName: 'Prof. M. K. Sridhar (Regional Director, AICTE)',
      userType: 'ADMIN',
      roles: ['APPROVING_AUTHORITY'],
      permissions: ['APPROVALS:EXECUTE', 'FDR:APPROVE'],
    };

    // Level 1: Senior Scrutiny Officer step approval
    await approvalService.approveStep(
      approvalId,
      {
        remarks: 'Level 1 Desk Scrutiny Concurred. All statutory parameters and bank lien verified in order.',
      },
      seniorOfficer
    );
    console.log(`   [STEP 1/2 APPROVED] Senior Scrutiny Officer concurrence recorded.`);

    // Level 2: Regional Director final sanction
    const finalApproval = await approvalService.approveStep(
      approvalId,
      {
        remarks:
          'Under the statutory authority delegated by the All India Council for Technical Education (AICTE), the pledged Fixed Deposit Receipt is hereby formally approved and placed into active custody in the National Statutory Digital Ledger. The commercial bank lien is recognized, and the institutional compliance deficit is credited accordingly.',
      },
      approvingDirector
    );

    console.log(`✅ [PHASE 5 SUCCESS] Executive Sanction Granted!`);
    console.log(`   Approval Request: ${finalApproval.approvalId}`);
    console.log(`   Final Decision: [${finalApproval.finalDecision}] | Is Completed: ${finalApproval.isCompleted}`);
    console.log(`   Total Steps Authorized: ${finalApproval.totalSteps}/${finalApproval.totalSteps}`);

    // Verify FDR state in DB
    const updatedFdr = await Fdr.findOne({ fdrId: createdFdr.fdrId });
    console.log(`   FDR Final Submission Status: [${updatedFdr?.submissionStatus}]`);
    console.log(`   FDR Final Verification Status: [${updatedFdr?.verificationStatus}]`);
    console.log(`   FDR Lifecycle Status: [${updatedFdr?.lifecycleStatus}]`);

    // -------------------------------------------------------------------------
    // PHASE 6: FINAL STATUTORY RECONCILIATION & DEFICIT ELIMINATION
    // -------------------------------------------------------------------------
    console.log('\n--------------------------------------------------------------------------------');
    console.log('📊 PHASE 6: STATUTORY COMPLIANCE RECONCILIATION & DEFICIT ELIMINATION');
    console.log('--------------------------------------------------------------------------------');

    const updatedRequirement = await Requirement.findOne({ requirementId: createdReq.requirementId });
    if (!updatedRequirement) {
      throw new Error('Updated requirement not found!');
    }

    const finalCompliance = requirementService.calculateCompliance(updatedRequirement);

    console.log(`   Requirement ID: ${finalCompliance.requirementId}`);
    console.log(`   Mandated Deposit Amount: ${finalCompliance.requiredAmountFormatted}`);
    console.log(`   Eligible Verified Pledged: ${finalCompliance.eligibleVerifiedDepositFormatted}`);
    console.log(`   Outstanding Deficit: ${finalCompliance.outstandingShortfallFormatted}`);
    console.log(`   Final Statutory Status: [${finalCompliance.complianceStatus}]`);
    console.log(`   Is Fully Compliant: ${finalCompliance.isCompliant ? 'YES (100% COMPLIANT)' : 'NO'}`);

    console.log('\n================================================================================');
    console.log('🎉 PLAN EXECUTION COMPLETED SUCCESSFULLY WITH ZERO DEFICIT AND FULL SANCTION!');
    console.log('================================================================================\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ ERROR OCCURRED DURING PLAN EXECUTION:', error);
    process.exit(1);
  }
}

processPlanDemonstration();
