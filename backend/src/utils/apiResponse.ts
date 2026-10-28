import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: PaginationMeta | Record<string, unknown>;
  errors?: unknown[];
  errorCode?: string;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: PaginationMeta | Record<string, unknown>
  ): Response {
    const payload: ApiEnvelope<T> = {
      success: true,
      statusCode,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    items: T[],
    pagination: { page: number; limit: number; total: number },
    message: string = 'Data retrieved successfully'
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1,
    };
    return this.success(res, items, message, 200, meta);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
