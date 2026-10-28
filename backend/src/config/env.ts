import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DOCUMENT_STORAGE_PROVIDER: z.string().default('local'),
  DOCUMENT_STORAGE_BUCKET: z.string().default('fdr-documents-bucket'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().default(process.env.EMAIL_HOST || 'smtp.gmail.com'),
  SMTP_PORT: z
    .string()
    .default(process.env.EMAIL_PORT || '587')
    .transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().default(process.env.EMAIL_USER || ''),
  SMTP_PASS: z.string().default(process.env.EMAIL_PASSWORD || ''),
  SMTP_FROM: z.string().default(process.env.SMTP_USER || 'devops@kaizeninfinities.com'),
  FROM_NAME: z.string().default('Kaizen'),
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.string().default('587').transform((val) => parseInt(val, 10)),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASSWORD: z.string().default(''),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables detected:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment configuration validation failed.');
}

export const env = parsed.data;
export type EnvConfig = z.infer<typeof envSchema>;
