"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const appError_1 = require("../utils/appError");
const notFoundHandler = (req, _res, next) => {
    next(appError_1.AppError.notFound(`Cannot find route ${req.method} ${req.originalUrl} on this server`));
};
exports.notFoundHandler = notFoundHandler;
