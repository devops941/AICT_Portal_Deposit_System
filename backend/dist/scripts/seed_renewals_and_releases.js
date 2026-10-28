"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const Fdr_model_1 = require("../models/Fdr.model");
const Renewal_model_1 = require("../models/Renewal.model");
const Release_model_1 = require("../models/Release.model");
async function seedRenewalsAndReleases() {
    console.log('\n============================================================');
    console.log('🌱 SEEDING STATUTORY RENEWALS & RELEASES / REFUNDS');
    console.log('============================================================\n');
    try {
        await (0, database_1.connectDatabase)();
        await Renewal_model_1.Renewal.deleteMany({});
        await Release_model_1.Release.deleteMany({});
        console.log('🧹 Cleaned existing renewal and release records.');
        const cegFdr = await Fdr_model_1.Fdr.findOne({ fdrNumber: 'SBI-FDR-2026-9901' });
        const psgFdr = await Fdr_model_1.Fdr.findOne({ fdrNumber: 'PNB-FDR-2026-4412' });
        const tceFdr = await Fdr_model_1.Fdr.findOne({ fdrNumber: 'CAN-FDR-2026-1189' });
        const citFdr = await Fdr_model_1.Fdr.findOne({ fdrNumber: 'IND-FDR-2026-6632' });
        const vitFdr = await Fdr_model_1.Fdr.findOne({ fdrNumber: 'HDFC-FDR-2026-7781' });
        const ssnFdr = await Fdr_model_1.Fdr.findOne({ fdrNumber: 'AXIS-FDR-2026-8841' });
        if (!cegFdr || !psgFdr || !tceFdr || !citFdr) {
            console.error('❌ Critical predecessor FDRs not found in database. Please run npm run seed:fdrs first!');
            process.exit(1);
        }
        const now = new Date();
        console.log('📦 Seeding Renewal requests...');
        const renewal1 = new Renewal_model_1.Renewal({
            renewalId: 'REN-2026-INST-CEG-001-88124',
            previousInstrumentId: cegFdr.fdrId,
            institutionId: cegFdr.institutionId,
            institutionName: cegFdr.institutionName,
            requirementId: cegFdr.requirementId,
            requirementTitle: cegFdr.requirementTitle,
            status: 'UNDER_REVIEW',
            renewalReason: 'Maturity approaching within 5 days. Submitted replacement FDR from State Bank of India with joint lien clause intact.',
            originalAmount: cegFdr.depositAmount,
            originalMaturityDate: cegFdr.maturityDate,
            originalFdrNumber: cegFdr.fdrNumber,
            originalBankName: cegFdr.bankName,
            requestedBy: 'Dean / Authorized Representative',
            requestedByEmail: 'deanceg@annauniv.edu',
            replacementDetails: {
                instrumentType: 'FDR',
                bankName: 'State Bank of India',
                bankBranch: 'Guindy Corporate Branch, Chennai - 600025',
                fdrNumber: 'SBI-FDR-2031-10291',
                holderName: 'Joint Account: College of Engineering, Guindy & Regional Officer, AICTE',
                depositAmount: cegFdr.depositAmount,
                issueDate: new Date(),
                maturityDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
                documentReferences: ['DOC-FDR-SBI-RENEWAL-01', 'DOC-SFMS-VERIFICATION-2026'],
                isJointAccount: true,
                autoRenewal: true,
                interestRate: 7.40,
                remarks: 'Fresh 5-year replacement FDR submitted as per AICTE Regulation Clause 8(4)',
            },
            history: [
                {
                    action: 'INITIATED',
                    performedBy: 'Dean CEG',
                    performedByEmail: 'deanceg@annauniv.edu',
                    details: 'Initiated renewal request with replacement FDR details',
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                },
                {
                    action: 'STATUS_CHANGED',
                    performedBy: 'AICTE Regional Scrutiny Officer',
                    performedByEmail: 'scrutiny.sro@aicte-india.org',
                    details: 'Moved to UNDER_REVIEW for bank SFMS confirmation',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                },
            ],
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            updatedAt: now,
        });
        await renewal1.save();
        const renewal2 = new Renewal_model_1.Renewal({
            renewalId: 'REN-2026-INST-PSG-002-39012',
            previousInstrumentId: psgFdr.fdrId,
            institutionId: psgFdr.institutionId,
            institutionName: psgFdr.institutionName,
            requirementId: psgFdr.requirementId,
            requirementTitle: psgFdr.requirementTitle,
            status: 'DRAFT',
            renewalReason: 'Maturity approaching in 22 days. Awaiting final board sanction and replacement FDR issuance from PNB Peelamedu.',
            originalAmount: psgFdr.depositAmount,
            originalMaturityDate: psgFdr.maturityDate,
            originalFdrNumber: psgFdr.fdrNumber,
            originalBankName: psgFdr.bankName,
            requestedBy: 'Principal PSG Tech',
            requestedByEmail: 'principal@psgtech.edu',
            history: [
                {
                    action: 'DRAFT_CREATED',
                    performedBy: 'Principal PSG Tech',
                    performedByEmail: 'principal@psgtech.edu',
                    details: 'Created draft renewal entry prior to replacement FDR scan',
                    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                },
            ],
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            updatedAt: now,
        });
        await renewal2.save();
        const renewal3 = new Renewal_model_1.Renewal({
            renewalId: 'REN-2026-INST-TCE-003-77201',
            previousInstrumentId: tceFdr.fdrId,
            replacementInstrumentId: 'FDR-2026-INST-TCE-003-REP-01',
            institutionId: tceFdr.institutionId,
            institutionName: tceFdr.institutionName,
            requirementId: tceFdr.requirementId,
            requirementTitle: tceFdr.requirementTitle,
            status: 'APPROVED',
            renewalReason: 'Proactive replacement of deposit instrument in full compliance with AICTE Approval Process Handbook.',
            originalAmount: tceFdr.depositAmount,
            originalMaturityDate: tceFdr.maturityDate,
            originalFdrNumber: tceFdr.fdrNumber,
            originalBankName: tceFdr.bankName,
            requestedBy: 'Registrar TCE',
            requestedByEmail: 'registrar@tce.edu',
            replacementDetails: {
                instrumentType: 'FDR',
                bankName: 'Canara Bank',
                bankBranch: 'Tirupparankundram, Madurai - 625015',
                fdrNumber: 'CAN-FDR-2032-99014',
                holderName: 'Joint Account: TCE & Regional Officer AICTE',
                depositAmount: tceFdr.depositAmount,
                issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                maturityDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
                documentReferences: ['DOC-CAN-REPLACE-2026-01'],
                isJointAccount: true,
                autoRenewal: true,
                interestRate: 7.30,
                remarks: 'Full statutory verification conducted. Lien marked in favor of AICTE.',
            },
            reviewedBy: 'AICTE Approving Authority',
            reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            reviewRemarks: 'Replacement instrument approved and active in security registry. Predecessor locked as archived predecessor.',
            history: [
                {
                    action: 'INITIATED',
                    performedBy: 'Registrar TCE',
                    performedByEmail: 'registrar@tce.edu',
                    details: 'Submitted replacement instrument for renewal',
                    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                },
                {
                    action: 'APPROVED',
                    performedBy: 'AICTE Approving Authority',
                    performedByEmail: 'approvals@aicte-india.org',
                    details: 'Verified and approved replacement instrument',
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                },
            ],
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        });
        await renewal3.save();
        console.log(`✅ Seeded 3 Renewal requests (UNDER_REVIEW, DRAFT, APPROVED).`);
        console.log('📦 Seeding Release & Refund requests...');
        const release1 = new Release_model_1.Release({
            releaseId: 'REL-2026-INST-CIT-004-94101',
            institutionId: citFdr.institutionId,
            institutionName: citFdr.institutionName,
            requirementId: citFdr.requirementId,
            requirementTitle: citFdr.requirementTitle,
            instrumentId: citFdr.fdrId,
            fdrNumber: citFdr.fdrNumber,
            bankName: citFdr.bankName,
            requestedAmount: citFdr.depositAmount,
            requestReason: 'Statutory lock-in period and academic mandate successfully completed. Requesting council sanction for deposit release and refund to institution account.',
            supportingDocuments: ['DOC-REL-NODUES-CIT-01', 'DOC-GOV-BODY-RESOLUTION-2026'],
            requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            status: 'SUBMITTED',
            approvalStatus: 'PENDING',
            isEligible: true,
            eligibilityScore: 100,
            eligibilityChecks: [
                {
                    checkKey: 'MATURITY_PASSED',
                    label: 'Statutory Tenure Completion',
                    passed: true,
                    severity: 'INFO',
                    message: 'Instrument has completed full mandated term and reached maturity',
                },
                {
                    checkKey: 'LIFECYCLE_ACTIVE',
                    label: 'Instrument Lifecycle Status',
                    passed: true,
                    severity: 'INFO',
                    message: 'Predecessor instrument is eligible for statutory discharge',
                },
                {
                    checkKey: 'NO_ACTIVE_DISPUTE',
                    label: 'Compliance & Dispute Clearance',
                    passed: true,
                    severity: 'INFO',
                    message: 'Zero pending council inquiries, disputes or institutional penalties',
                },
                {
                    checkKey: 'DOCUMENTS_VERIFIED',
                    label: 'No-Dues & Resolution Documents',
                    passed: true,
                    severity: 'INFO',
                    message: 'Audited clearance certificates and governing council resolutions uploaded',
                },
            ],
            blockingReasons: [],
            currentLevel: 1,
            totalLevels: 2,
            approvalLevels: [
                {
                    levelNumber: 1,
                    title: 'Level 1: Verification Officer Scrutiny',
                    roleRequired: 'VERIFICATION_OFFICER',
                    status: 'PENDING',
                },
                {
                    levelNumber: 2,
                    title: 'Level 2: Approving Authority Final Sanction',
                    roleRequired: 'APPROVING_AUTHORITY',
                    status: 'PENDING',
                },
            ],
            requestedBy: 'Principal CIT Coimbatore',
            requestedByEmail: 'principal@cit.edu.in',
            history: [
                {
                    action: 'SUBMITTED',
                    performedBy: 'Principal CIT Coimbatore',
                    performedByEmail: 'principal@cit.edu.in',
                    details: 'Submitted release request for ₹30,00,000 against matured instrument IND-FDR-2026-6632',
                    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                },
            ],
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            updatedAt: now,
        });
        await release1.save();
        if (vitFdr) {
            const release2 = new Release_model_1.Release({
                releaseId: 'REL-2026-INST-VIT-005-55201',
                institutionId: vitFdr.institutionId,
                institutionName: vitFdr.institutionName,
                requirementId: vitFdr.requirementId,
                requirementTitle: vitFdr.requirementTitle,
                instrumentId: vitFdr.fdrId,
                fdrNumber: vitFdr.fdrNumber,
                bankName: vitFdr.bankName,
                requestedAmount: vitFdr.depositAmount,
                requestReason: 'Course accreditation tenure satisfied. Transitioned to self-sustaining endowment with council intimation.',
                supportingDocuments: ['DOC-REL-NODUES-VIT-01', 'DOC-COUNCIL-CLEARANCE-VIT'],
                requestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                status: 'UNDER_REVIEW',
                approvalStatus: 'UNDER_SCRUTINY',
                isEligible: true,
                eligibilityScore: 95,
                eligibilityChecks: [
                    {
                        checkKey: 'MATURITY_PASSED',
                        label: 'Statutory Tenure Completion',
                        passed: true,
                        severity: 'INFO',
                        message: 'Mandated lock-in fulfilled under approval terms',
                    },
                    {
                        checkKey: 'NO_ACTIVE_DISPUTE',
                        label: 'Dispute & Penalty Clearance',
                        passed: true,
                        severity: 'INFO',
                        message: 'All regional office clearances verified and approved',
                    },
                ],
                blockingReasons: [],
                currentLevel: 2,
                totalLevels: 2,
                approvalLevels: [
                    {
                        levelNumber: 1,
                        title: 'Level 1: Verification Officer Scrutiny',
                        roleRequired: 'VERIFICATION_OFFICER',
                        status: 'APPROVED',
                        actionBy: 'Regional Verification Officer',
                        actionByEmail: 'officer.sro@aicte-india.org',
                        actionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                        remarks: 'All institutional accounts and student intake quotas verified. Recommended for final refund sanction.',
                    },
                    {
                        levelNumber: 2,
                        title: 'Level 2: Approving Authority Final Sanction',
                        roleRequired: 'APPROVING_AUTHORITY',
                        status: 'PENDING',
                    },
                ],
                requestedBy: 'Registrar VIT',
                requestedByEmail: 'registrar@vit.ac.in',
                history: [
                    {
                        action: 'SUBMITTED',
                        performedBy: 'Registrar VIT',
                        performedByEmail: 'registrar@vit.ac.in',
                        details: 'Initiated deposit refund request',
                        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                    {
                        action: 'LEVEL_1_APPROVED',
                        performedBy: 'Regional Verification Officer',
                        performedByEmail: 'officer.sro@aicte-india.org',
                        details: 'Level 1 scrutiny approved; escalated to Level 2',
                        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    },
                ],
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                updatedAt: now,
            });
            await release2.save();
        }
        if (ssnFdr) {
            const release3 = new Release_model_1.Release({
                releaseId: 'REL-2026-INST-SSN-008-11902',
                institutionId: ssnFdr.institutionId,
                institutionName: ssnFdr.institutionName,
                requirementId: ssnFdr.requirementId,
                requirementTitle: ssnFdr.requirementTitle,
                instrumentId: ssnFdr.fdrId,
                fdrNumber: ssnFdr.fdrNumber,
                bankName: ssnFdr.bankName,
                requestedAmount: ssnFdr.depositAmount,
                releasedAmount: ssnFdr.depositAmount,
                requestReason: 'Statutory term completion and zero academic dues.',
                supportingDocuments: ['DOC-REL-SSN-SETTLED-01'],
                requestDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                status: 'CLOSED',
                approvalStatus: 'APPROVED',
                isEligible: true,
                eligibilityScore: 100,
                eligibilityChecks: [
                    {
                        checkKey: 'MATURITY_PASSED',
                        label: 'Statutory Tenure Completion',
                        passed: true,
                        severity: 'INFO',
                        message: 'Term complete',
                    },
                ],
                blockingReasons: [],
                currentLevel: 2,
                totalLevels: 2,
                approvalLevels: [
                    {
                        levelNumber: 1,
                        title: 'Level 1: Verification Officer Scrutiny',
                        roleRequired: 'VERIFICATION_OFFICER',
                        status: 'APPROVED',
                        actionBy: 'Regional Officer',
                        actionByEmail: 'officer.sro@aicte-india.org',
                        actionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                        remarks: 'Verified',
                    },
                    {
                        levelNumber: 2,
                        title: 'Level 2: Approving Authority Final Sanction',
                        roleRequired: 'APPROVING_AUTHORITY',
                        status: 'APPROVED',
                        actionBy: 'AICTE Member Secretary',
                        actionByEmail: 'membersec@aicte-india.org',
                        actionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                        remarks: 'Discharge sanctioned. Bank lien release letter issued.',
                    },
                ],
                authorizedReleaseAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                authorizedReleaseBy: 'AICTE Member Secretary',
                closedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                closedBy: 'AICTE Finance Officer',
                decisionRemarks: 'Refund sanctioned in full to institutional account via PFMS.',
                requestedBy: 'Principal SSN',
                requestedByEmail: 'principal@ssn.edu.in',
                history: [
                    {
                        action: 'SUBMITTED',
                        performedBy: 'Principal SSN',
                        performedByEmail: 'principal@ssn.edu.in',
                        details: 'Submitted release request',
                        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                    },
                    {
                        action: 'SANCTIONED_AND_CLOSED',
                        performedBy: 'AICTE Finance Officer',
                        performedByEmail: 'finance@aicte-india.org',
                        details: 'Final discharge authorized and closed',
                        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                    },
                ],
                createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            });
            await release3.save();
        }
        console.log(`✅ Seeded 3 Release requests (SUBMITTED, UNDER_REVIEW, CLOSED).`);
        console.log('\n============================================================');
        console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
        console.log('============================================================\n');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    }
}
seedRenewalsAndReleases();
