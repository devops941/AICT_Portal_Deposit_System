import { DiscrepancySeverity, DiscrepancyResolutionStatus, DiscrepancyType } from '../../models/Discrepancy.model';

export { DiscrepancySeverity, DiscrepancyResolutionStatus, DiscrepancyType };

export interface CreateDiscrepancyInput {
  instrumentId: string;
  institutionId?: string;
  requirementId?: string;
  discrepancyType: DiscrepancyType;
  title: string;
  description: string;
  severity: DiscrepancySeverity;
  assignedTo?: string;
}

export interface ResolveDiscrepancyInput {
  resolutionStatus: 'RESOLVED' | 'WAIVED';
  resolutionRemarks: string;
}

export interface DiscrepancyFilterParams {
  instrumentId?: string;
  institutionId?: string;
  discrepancyType?: string;
  severity?: string;
  resolutionStatus?: string;
  page?: number;
  limit?: number;
  search?: string;
}
