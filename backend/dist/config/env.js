"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000').transform((val) => parseInt(val, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('production'),
    MONGODB_URI: zod_1.z.string().default(process.env.MONGODB_URI ||
        'mongodb+srv://devops_db_user:jcj8Mkf1GQKJ1ZGl@cluster0.uurxkmz.mongodb.net/security-deposit?retryWrites=true&w=majority'),
    JWT_ACCESS_SECRET: zod_1.z.string().default(process.env.JWT_ACCESS_SECRET ||
        '4bd4e57b94c6d8041254e3b08f5f98b068e21bcd3b41eb464ff7e3097ecf48feed432e3b97905737209f9703479f85344d577b35067e81b6a4cef36466b9abc0'),
    JWT_REFRESH_SECRET: zod_1.z.string().default(process.env.JWT_REFRESH_SECRET ||
        '1bd4599e0bf9450fcf336350f967f0f081c30931b87cac837c641c083d2281e4b89d9f269bba85f69ed8634e27bb774c1a5b87d235e40f7a384476a1311ebb99'),
    CLIENT_URL: zod_1.z.string().default(process.env.CLIENT_URL || '*'),
    DOCUMENT_STORAGE_PROVIDER: zod_1.z.string().default('local'),
    DOCUMENT_STORAGE_BUCKET: zod_1.z.string().default('fdr-documents-bucket'),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional().default(process.env.CLOUDINARY_CLOUD_NAME || 'uoyjkcmp'),
    CLOUDINARY_API_KEY: zod_1.z.string().optional().default(process.env.CLOUDINARY_API_KEY || '683385166799711'),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional().default(process.env.CLOUDINARY_API_SECRET || 'rBYiSVv8BhHyz4zwyaJDSmruBrA'),
    SMTP_HOST: zod_1.z.string().default(process.env.EMAIL_HOST || 'smtp.gmail.com'),
    SMTP_PORT: zod_1.z
        .string()
        .default(process.env.EMAIL_PORT || '587')
        .transform((val) => parseInt(val, 10)),
    SMTP_USER: zod_1.z.string().default(process.env.EMAIL_USER || ''),
    SMTP_PASS: zod_1.z.string().default(process.env.EMAIL_PASSWORD || ''),
    SMTP_FROM: zod_1.z.string().default(process.env.SMTP_USER || 'devops@kaizeninfinities.com'),
    FROM_NAME: zod_1.z.string().default('Kaizen'),
    EMAIL_HOST: zod_1.z.string().default('smtp.gmail.com'),
    EMAIL_PORT: zod_1.z.string().default('587').transform((val) => parseInt(val, 10)),
    EMAIL_USER: zod_1.z.string().default(''),
    EMAIL_PASSWORD: zod_1.z.string().default(''),
    REDIS_URL: zod_1.z.string().default(process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables detected:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Environment configuration validation failed.');
}
exports.env = parsed.data;
