"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthQuerySchema = void 0;
const zod_1 = require("zod");
exports.healthQuerySchema = {
    query: zod_1.z.object({
        detailed: zod_1.z.enum(['true', 'false']).optional(),
    }),
};
