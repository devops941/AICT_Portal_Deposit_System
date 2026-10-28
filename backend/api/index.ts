import app from '../src/app';
import { connectDatabase } from '../src/config/database';

export default async function handler(req: any, res: any) {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Serverless database connection error:', error);
  }
  return app(req, res);
}
