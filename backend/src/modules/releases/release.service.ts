import mongoose from 'mongoose';
import { Release, IRelease, ReleaseStatus } from '../../models/Release.model';
import { Fdr, IFdr } from '../../models/Fdr.model';
import { Requirement } from '../../models/Requirement.model';
import { requirementService } from '../requirements/requirement.service';
import { releaseRepository, ReleaseRepository } from './release.repository';
import { eligibilityAssessmentEngine } from './release.eligibility';
import { DecimalUtils } from '../../utils/decimal';
import { AppError } from '../../utils/appError';
import { AuthUserContext } from '../../middleware/auth.middleware';
import {
  CreateReleaseInput,
  ReviewReleaseInput,
  ClarificationResponseInput,
  ApproveReleaseInput,
  RejectReleaseInput,
  CloseReleaseInput,
  ReleaseFilterParams,
} from './release.types';

export class ReleaseService {
  constructor(private repo: ReleaseRepository = releaseRepository) {}

  /**
   * Pre-check eligibility for an instrument before initiating a release
   */
  async assessEligibility(instrumentId: string, user: AuthUserContext) {
    const instrument = await Fdr.findOne({
      $or: [
        { fdrId: instrumentId.toUpperCase().trim() },
        ...(mongoose.Types.ObjectId.isValid(instrumentId) ? [{ _id: instrumentId }] : []),
      ],
    });

    if (!instrument) {
      throw AppError.notFound(`Instrument '${instrumentId}' not found`);
    }

    if (user.institutionId && instrument.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to instrument belonging to another institution');
    }

    return eligibilityAssessmentEngine.assessEligibility(instrument.fdrId);
  }

  /**
   * Create a new Release Request
   * Enforces multi-criteria eligibility check and prevents duplicate release requests.
   */
  async createRelease(input: CreateReleaseInput, user: AuthUserContext): Promise<IRelease> {
    const instrument = await Fdr.findOne({
      $or: [
        { fdrId: input.instrumentId.toUpperCase().trim() },
        ...(mongoose.Types.ObjectId.isValid(input.instrumentId) ? [{ _id: input.instrumentId }] : []),
      ],
    });

    if (!instrument) {
      throw AppError.notFound(`Target instrument '${input.instrumentId}' not found`);
    }

    if (user.institutionId && instrument.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to create release request for another institution');
    }

    // 1. Run eligibility assessment
    const assessment = await eligibilityAssessmentEngine.assessEligibility(
      instrument.fdrId,
      input.requestedAmount,
      input.supportingDocuments
    );

    // If there are BLOCKER reasons (e.g. duplicate active release, already released, etc.), reject request creation
    if (!assessment.isEligible && assessment.blockingReasons.length > 0) {
      throw AppError.badRequest(
        `Ineligible for release: ${assessment.blockingReasons.join('; ')}`
      );
    }

    // 2. Resolve requested amount
    const parsedAmount = input.requestedAmount
      ? DecimalUtils.toFixedString(input.requestedAmount)
      : DecimalUtils.toFixedString(instrument.depositAmount);

    const year = new Date().getFullYear();
    const suffix = Math.floor(10000 + Math.random() * 90000);
    const releaseId = `REL-${year}-${instrument.institutionId}-${suffix}`;
    const now = new Date();

    const approvalLevels = [
      {
        levelNumber: 1,
        title: 'Level 1: Verification Officer Scrutiny',
        roleRequired: 'VERIFICATION_OFFICER',
        status: 'PENDING' as const,
      },
      {
        levelNumber: 2,
        title: 'Level 2: Approving Authority Final Sanction',
        roleRequired: 'APPROVING_AUTHORITY',
        status: 'PENDING' as const,
      },
    ];

    const release = await this.repo.create({
      releaseId,
      institutionId: instrument.institutionId,
      institutionName: instrument.institutionName,
      requirementId: instrument.requirementId,
      requirementTitle: instrument.requirementTitle,
      instrumentId: instrument.fdrId,
      fdrNumber: instrument.fdrNumber,
      bankName: instrument.bankName,
      requestedAmount: mongoose.Types.Decimal128.fromString(parsedAmount),
      requestReason: input.requestReason.trim(),
      supportingDocuments: input.supportingDocuments || [],
      requestDate: now,
      status: 'SUBMITTED',
      approvalStatus: 'PENDING',
      isEligible: assessment.isEligible,
      eligibilityScore: assessment.eligibilityScore,
      eligibilityChecks: assessment.checks,
      blockingReasons: assessment.blockingReasons,
      currentLevel: 1,
      totalLevels: approvalLevels.length,
      approvalLevels,
      requestedBy: user.fullName || user.email,
      requestedByEmail: user.email,
      history: [
        {
          action: 'RELEASE_REQUEST_SUBMITTED',
          performedBy: user.fullName || user.email,
          performedByEmail: user.email,
          role: user.roles?.[0] || 'INSTITUTION_USER',
          details: `Release request initiated for FDR #${instrument.fdrNumber} (${instrument.bankName}) for amount ₹${parsedAmount}`,
          timestamp: now,
        },
      ],
    });

    // Link release on instrument
    instrument.releaseRequestId = release.releaseId;
    await instrument.save();

    return release;
  }

  /**
   * Officer Review & Clarification Request
   */
  async reviewRelease(id: string, input: ReviewReleaseInput, user: AuthUserContext): Promise<IRelease> {
    const isOfficer =
      user.userType === 'ADMIN' ||
      user.roles.includes('SYSTEM_ADMINISTRATOR') ||
      user.roles.includes('VERIFICATION_OFFICER') ||
      user.roles.includes('SENIOR_VERIFICATION_OFFICER') ||
      user.roles.includes('AICTE_OFFICER') ||
      user.roles.includes('APPROVING_AUTHORITY');

    if (!isOfficer) {
      throw AppError.forbidden('Only authorized scrutiny officers can review release requests');
    }

    const release = await this.repo.findByIdOrReleaseId(id);
    if (!release) {
      throw AppError.notFound(`Release request '${id}' not found`);
    }

    if (release.status === 'APPROVED' || release.status === 'REJECTED' || release.status === 'CLOSED') {
      throw AppError.badRequest(`Cannot modify release request in '${release.status}' status`);
    }

    const now = new Date();
    if (input.action === 'CLARIFICATION_REQUIRED') {
      if (!input.clarificationQuery?.trim()) {
        throw AppError.badRequest('Clarification query is required when requesting clarification');
      }
      release.status = 'CLARIFICATION_REQUIRED';
      release.approvalStatus = 'UNDER_SCRUTINY';
      release.clarificationQuery = input.clarificationQuery.trim();
      release.history.push({
        action: 'CLARIFICATION_REQUESTED',
        performedBy: user.fullName || user.email,
        performedByEmail: user.email,
        role: user.roles?.[0],
        details: `Clarification requested: "${input.clarificationQuery.trim()}"`,
        timestamp: now,
      });
    } else {
      release.status = 'UNDER_REVIEW';
      release.approvalStatus = 'UNDER_SCRUTINY';
      if (input.decisionRemarks) {
        release.decisionRemarks = input.decisionRemarks.trim();
      }
      release.history.push({
        action: 'MOVED_TO_SCRUTINY',
        performedBy: user.fullName || user.email,
        performedByEmail: user.email,
        role: user.roles?.[0],
        details: input.decisionRemarks || 'Release request taken under active scrutiny',
        timestamp: now,
      });
    }

    await release.save();
    return release;
  }

  /**
   * Institution responds to clarification
   */
  async respondClarification(
    id: string,
    input: ClarificationResponseInput,
    user: AuthUserContext
  ): Promise<IRelease> {
    const release = await this.repo.findByIdOrReleaseId(id);
    if (!release) {
      throw AppError.notFound(`Release request '${id}' not found`);
    }

    if (user.institutionId && release.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied');
    }

    if (release.status !== 'CLARIFICATION_REQUIRED') {
      throw AppError.badRequest(
        `Cannot respond to clarification when status is '${release.status}'`
      );
    }

    const now = new Date();
    release.clarificationResponse = input.response.trim();
    if (input.supportingDocuments && input.supportingDocuments.length > 0) {
      release.supportingDocuments = [
        ...new Set([...release.supportingDocuments, ...input.supportingDocuments]),
      ];
    }
    release.status = 'UNDER_REVIEW';

    release.history.push({
      action: 'CLARIFICATION_SUBMITTED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      role: 'INSTITUTION_USER',
      details: `Clarification response provided: "${input.response.trim()}"`,
      timestamp: now,
    });

    await release.save();
    return release;
  }

  /**
   * Approve Release Request (Multi-Level Progression)
   * Enforces Separation of Duties:
   * 1. Requester cannot approve their own release.
   * 2. Requisite role required per approval level.
   */
  async approveRelease(id: string, input: ApproveReleaseInput, user: AuthUserContext): Promise<IRelease> {
    const release = await this.repo.findByIdOrReleaseId(id);
    if (!release) {
      throw AppError.notFound(`Release request '${id}' not found`);
    }

    // Invalid State Transition Guard
    if (release.status === 'APPROVED' || release.status === 'AUTHORIZED_RELEASE' || release.status === 'CLOSED') {
      throw AppError.badRequest(`Release request has already been approved (Current status: ${release.status})`);
    }

    if (release.status === 'REJECTED') {
      throw AppError.badRequest('Cannot approve a rejected release request');
    }

    // Separation of Duties: Requester Self-Approval Check
    if (user.email === release.requestedByEmail) {
      throw AppError.forbidden('Separation of Duties violation: A user cannot approve their own release request');
    }

    const currentLevelIdx = release.currentLevel - 1;
    const currentStep = release.approvalLevels[currentLevelIdx];
    if (!currentStep) {
      throw AppError.badRequest('No pending approval levels remaining');
    }

    // Check Role Authority for Current Level
    const isSuperAdmin = user.userType === 'ADMIN' || user.roles.includes('SYSTEM_ADMINISTRATOR');
    const hasRole =
      user.roles.includes(currentStep.roleRequired) ||
      (currentStep.roleRequired === 'VERIFICATION_OFFICER' &&
        (user.roles.includes('SENIOR_VERIFICATION_OFFICER') || user.roles.includes('AICTE_OFFICER'))) ||
      isSuperAdmin;
    if (!hasRole) {
      throw AppError.forbidden(
        `Access denied: Current level (${currentStep.title}) requires role '${currentStep.roleRequired}'`
      );
    }

    const now = new Date();
    currentStep.status = 'APPROVED';
    currentStep.actionBy = user.fullName || user.email;
    currentStep.actionByEmail = user.email;
    currentStep.actionDate = now;
    currentStep.remarks = input.decisionRemarks.trim();

    release.history.push({
      action: `LEVEL_${release.currentLevel}_APPROVED`,
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      role: user.roles?.[0],
      details: `${currentStep.title} approved. Remarks: ${input.decisionRemarks.trim()}`,
      timestamp: now,
    });

    // Check if more approval levels exist
    if (release.currentLevel < release.totalLevels) {
      release.currentLevel++;
      release.status = 'UNDER_REVIEW';
      release.approvalStatus = 'UNDER_SCRUTINY';
    } else {
      // Final Level Approved
      release.status = 'APPROVED';
      release.approvalStatus = 'APPROVED';
      release.decisionRemarks = input.decisionRemarks.trim();
    }

    await release.save();
    return release;
  }

  /**
   * Reject Release Request
   */
  async rejectRelease(id: string, input: RejectReleaseInput, user: AuthUserContext): Promise<IRelease> {
    const isOfficer =
      user.userType === 'ADMIN' ||
      user.roles.includes('SYSTEM_ADMINISTRATOR') ||
      user.roles.includes('VERIFICATION_OFFICER') ||
      user.roles.includes('SENIOR_VERIFICATION_OFFICER') ||
      user.roles.includes('AICTE_OFFICER') ||
      user.roles.includes('APPROVING_AUTHORITY');

    if (!isOfficer) {
      throw AppError.forbidden('Only authorized officers can reject release requests');
    }

    const release = await this.repo.findByIdOrReleaseId(id);
    if (!release) {
      throw AppError.notFound(`Release request '${id}' not found`);
    }

    if (release.status === 'APPROVED' || release.status === 'AUTHORIZED_RELEASE' || release.status === 'CLOSED') {
      throw AppError.badRequest(`Cannot reject release request in finalized '${release.status}' status`);
    }

    if (release.status === 'REJECTED') {
      throw AppError.badRequest('Release request is already rejected');
    }

    const now = new Date();
    release.status = 'REJECTED';
    release.approvalStatus = 'REJECTED';
    release.rejectionReason = input.rejectionReason.trim();

    release.history.push({
      action: 'RELEASE_REJECTED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      role: user.roles?.[0],
      details: `Release request rejected. Reason: ${input.rejectionReason.trim()}`,
      timestamp: now,
    });

    await release.save();
    return release;
  }

  /**
   * Authorize Release
   * Officially sanctions the release, transitions instrument status to RELEASED,
   * and updates deposit requirement compliance.
   * Portal constraint: Records statutory release decision accurately without claiming bank wire transfer.
   */
  async authorizeRelease(id: string, user: AuthUserContext): Promise<IRelease> {
    const isAuthorizedApprover =
      user.userType === 'ADMIN' ||
      user.roles.includes('APPROVING_AUTHORITY') ||
      user.roles.includes('FINANCE_OFFICER');

    if (!isAuthorizedApprover) {
      throw AppError.forbidden(
        'Only Approving Authority or Finance Officer can issue final Release Authorization'
      );
    }

    const release = await this.repo.findByIdOrReleaseId(id);
    if (!release) {
      throw AppError.notFound(`Release request '${id}' not found`);
    }

    if (release.status !== 'APPROVED') {
      throw AppError.badRequest(
        `Cannot authorize release: Current status is '${release.status}'. Workflow must be fully APPROVED first.`
      );
    }

    const now = new Date();
    release.status = 'AUTHORIZED_RELEASE';
    release.releasedAmount = release.requestedAmount;
    release.authorizedReleaseAt = now;
    release.authorizedReleaseBy = user.email;

    release.history.push({
      action: 'RELEASE_AUTHORIZED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      role: user.roles?.[0],
      details: `Statutory release authorized by council authority. Release amount: ₹${DecimalUtils.toFixedString(release.requestedAmount)}`,
      timestamp: now,
    });

    await release.save();

    // 1. Update Instrument lifecycle
    const instrument = await Fdr.findOne({ fdrId: release.instrumentId });
    if (instrument) {
      instrument.lifecycleStatus = 'RELEASED';
      instrument.releasedAt = now;
      instrument.releasedBy = user.email;
      instrument.history.push({
        action: 'DEPOSIT_RELEASED',
        performedBy: user.fullName || user.email,
        performedByEmail: user.email,
        details: `Statutory security deposit discharged under Release Request #${release.releaseId}`,
        timestamp: now,
      });
      await instrument.save();
    }

    // 2. Recompute Deposit Requirement Compliance
    try {
      const requirement = await Requirement.findOne({ requirementId: release.requirementId });
      if (requirement) {
        // Remove released instrument or set status to RELEASED
        requirement.pledgedInstruments = (requirement.pledgedInstruments || []).filter(
          (p) => p.instrumentId !== instrument?.fdrNumber && p.instrumentId !== instrument?.fdrId
        );
        const comp = requirementService.calculateCompliance(requirement);
        requirement.complianceStatus = comp.complianceStatus;
        await requirement.save();
      }
    } catch (err) {
      console.error('Failed to sync requirement after release authorization:', err);
    }

    return release;
  }

  /**
   * Close Release Record
   * Marks statutory release as officially CLOSED / DISCHARGED.
   */
  async closeRelease(id: string, input: CloseReleaseInput, user: AuthUserContext): Promise<IRelease> {
    const isOfficer =
      user.userType === 'ADMIN' ||
      user.roles.includes('SYSTEM_ADMINISTRATOR') ||
      user.roles.includes('VERIFICATION_OFFICER') ||
      user.roles.includes('SENIOR_VERIFICATION_OFFICER') ||
      user.roles.includes('AICTE_OFFICER') ||
      user.roles.includes('APPROVING_AUTHORITY');

    if (!isOfficer) {
      throw AppError.forbidden('Only authorized officers can close release records');
    }

    const release = await this.repo.findByIdOrReleaseId(id);
    if (!release) {
      throw AppError.notFound(`Release request '${id}' not found`);
    }

    if (release.status === 'CLOSED') {
      throw AppError.badRequest('Release request is already closed');
    }

    if (release.status !== 'AUTHORIZED_RELEASE' && release.status !== 'APPROVED') {
      throw AppError.badRequest(
        `Cannot close release: Current status is '${release.status}'. Must be AUTHORIZED_RELEASE or APPROVED.`
      );
    }

    const now = new Date();
    release.status = 'CLOSED';
    release.closedAt = now;
    release.closedBy = user.email;
    release.decisionRemarks = input.closureRemarks.trim();

    release.history.push({
      action: 'RELEASE_RECORD_CLOSED',
      performedBy: user.fullName || user.email,
      performedByEmail: user.email,
      role: user.roles?.[0],
      details: `Release record closed and archived. Remarks: ${input.closureRemarks.trim()}${
        input.settlementReference ? ` (Ref: ${input.settlementReference.trim()})` : ''
      }`,
      timestamp: now,
    });

    await release.save();
    return release;
  }

  /**
   * Get single release request details with side-by-side instrument info
   */
  async getReleaseById(id: string, user: AuthUserContext) {
    const release = await this.repo.findByIdOrReleaseId(id);
    if (!release) {
      throw AppError.notFound(`Release request '${id}' not found`);
    }

    if (user.institutionId && release.institutionId !== user.institutionId) {
      throw AppError.forbidden('Access denied to release details of another institution');
    }

    const instrument = await Fdr.findOne({ fdrId: release.instrumentId });
    const requirement = await Requirement.findOne({ requirementId: release.requirementId });

    return {
      release: {
        ...release.toObject(),
        requestedAmountFormatted: DecimalUtils.formatCurrency(release.requestedAmount),
        releasedAmountFormatted: release.releasedAmount
          ? DecimalUtils.formatCurrency(release.releasedAmount)
          : undefined,
      },
      instrument: instrument
        ? {
            ...instrument.toObject(),
            depositAmountFormatted: DecimalUtils.formatCurrency(
              instrument.depositAmount,
              instrument.currency
            ),
          }
        : null,
      requirement: requirement
        ? {
            ...requirement.toObject(),
            requiredAmountFormatted: DecimalUtils.formatCurrency(
              requirement.requiredAmount,
              requirement.currency
            ),
          }
        : null,
    };
  }

  /**
   * List releases with search, status filtering, and pagination
   */
  async listReleases(params: ReleaseFilterParams, user: AuthUserContext) {
    const query: any = {};

    if (user.institutionId) {
      query.institutionId = user.institutionId;
    } else if (params.institutionId) {
      query.institutionId = params.institutionId;
    }

    if (params.status && params.status !== 'ALL') {
      query.status = params.status;
    }

    if (params.requirementId) {
      query.requirementId = params.requirementId;
    }

    if (params.search) {
      const regex = new RegExp(params.search.trim(), 'i');
      query.$or = [
        { releaseId: regex },
        { instrumentId: regex },
        { fdrNumber: regex },
        { institutionName: regex },
        { bankName: regex },
      ];
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const { releases, total } = await this.repo.find(query, skip, limit);

    const enriched = releases.map((r) => ({
      ...r.toObject(),
      requestedAmountFormatted: DecimalUtils.formatCurrency(r.requestedAmount),
      releasedAmountFormatted: r.releasedAmount
        ? DecimalUtils.formatCurrency(r.releasedAmount)
        : undefined,
    }));

    return { data: enriched, total, page, limit };
  }

  /**
   * Get Release Dashboard Metrics
   */
  async getDashboardMetrics(user: AuthUserContext) {
    const query: any = {};
    if (user.institutionId) {
      query.institutionId = user.institutionId;
    }

    const allReleases = await Release.find(query);

    let totalReleasedDec = DecimalUtils.from(0);
    let pendingCount = 0;
    let underReviewCount = 0;
    let clarificationCount = 0;
    let approvedCount = 0;
    let authorizedCount = 0;
    let closedCount = 0;
    let rejectedCount = 0;

    for (const r of allReleases) {
      if (r.status === 'SUBMITTED') pendingCount++;
      else if (r.status === 'UNDER_REVIEW') underReviewCount++;
      else if (r.status === 'CLARIFICATION_REQUIRED') clarificationCount++;
      else if (r.status === 'APPROVED') approvedCount++;
      else if (r.status === 'AUTHORIZED_RELEASE') {
        authorizedCount++;
        totalReleasedDec = DecimalUtils.add(totalReleasedDec, r.requestedAmount);
      } else if (r.status === 'CLOSED') {
        closedCount++;
        totalReleasedDec = DecimalUtils.add(totalReleasedDec, r.requestedAmount);
      } else if (r.status === 'REJECTED') rejectedCount++;
    }

    return {
      totalRequests: allReleases.length,
      pending: pendingCount,
      underReview: underReviewCount,
      clarificationRequired: clarificationCount,
      approved: approvedCount,
      authorizedRelease: authorizedCount,
      closed: closedCount,
      rejected: rejectedCount,
      totalReleasedAmount: DecimalUtils.formatCurrency(totalReleasedDec),
    };
  }
}

export const releaseService = new ReleaseService();
