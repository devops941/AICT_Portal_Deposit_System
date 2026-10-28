import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  MONGODB_URI: z.string().default(
    process.env.MONGODB_URI ||
    'mongodb+srv://devops_db_user:jcj8Mkf1GQKJ1ZGl@cluster0.uurxkmz.mongodb.net/security-deposit?retryWrites=true&w=majority'
  ),
  JWT_ACCESS_SECRET: z.string().default(
    process.env.JWT_ACCESS_SECRET ||
    '4bd4e57b94c6d8041254e3b08f5f98b068e21bcd3b41eb464ff7e3097ecf48feed432e3b97905737209f9703479f85344d577b35067e81b6a4cef36466b9abc0'
  ),
  JWT_REFRESH_SECRET: z.string().default(
    process.env.JWT_REFRESH_SECRET ||
    '1bd4599e0bf9450fcf336350f967f0f081c30931b87cac837c641c083d2281e4b89d9f269bba85f69ed8634e27bb774c1a5b87d235e40f7a384476a1311ebb99'
  ),
  CLIENT_URL: z.string().default(process.env.CLIENT_URL || '*'),
  DOCUMENT_STORAGE_PROVIDER: z.string().default('local'),
  DOCUMENT_STORAGE_BUCKET: z.string().default('fdr-documents-bucket'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(process.env.CLOUDINARY_CLOUD_NAME || 'uoyjkcmp'),
  CLOUDINARY_API_KEY: z.string().optional().default(process.env.CLOUDINARY_API_KEY || '683385166799711'),
  CLOUDINARY_API_SECRET: z.string().optional().default(process.env.CLOUDINARY_API_SECRET || 'rBYiSVv8BhHyz4zwyaJDSmruBrA'),
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
  REDIS_URL: z.string().default(process.env.REDIS_URL || 'redis://127.0.0.1:6379'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables detected:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment configuration validation failed.');
}

export const env = parsed.data;
export type EnvConfig = z.infer<typeof envSchema>;
