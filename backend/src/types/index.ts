export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export type UserRole = 'AICTE_ADMIN' | 'INSTITUTION_USER' | 'FINANCE_OFFICER' | 'BANK_NODAL';
