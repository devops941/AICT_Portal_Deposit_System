import app from '../backend/src/app';
import { connectDatabase } from '../backend/src/config/database';

export default async function handler(req: any, res: any) {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('Root serverless database connection error:', error);
  }
  return app(req, res);
}
