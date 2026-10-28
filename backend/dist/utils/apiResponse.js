"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200, meta) {
        const payload = {
            success: true,
            statusCode,
            message,
            data,
            meta,
            timestamp: new Date().toISOString(),
        };
        return res.status(statusCode).json(payload);
    }
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }
    static paginated(res, items, pagination, message = 'Data retrieved successfully') {
        const totalPages = Math.ceil(pagination.total / pagination.limit);
        const meta = {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages,
            hasNextPage: pagination.page < totalPages,
            hasPrevPage: pagination.page > 1,
        };
        return this.success(res, items, message, 200, meta);
    }
    static noContent(res) {
        return res.status(204).send();
    }
}
exports.ApiResponse = ApiResponse;
