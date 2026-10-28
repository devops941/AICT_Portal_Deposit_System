"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.validateRequest = void 0;
const zod_1 = require("zod");
const appError_1 = require("../utils/appError");
const validateRequest = (schema) => {
    return async (req, _res, next) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = (await schema.query.parseAsync(req.query));
            }
            if (schema.params) {
                req.params = (await schema.params.parseAsync(req.params));
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                return next(appError_1.AppError.unprocessable('Validation failed on incoming request parameters', formattedErrors));
            }
            next(error);
        }
    };
};
exports.validateRequest = validateRequest;
const validate = (schema) => (0, exports.validateRequest)({ body: schema });
exports.validate = validate;
