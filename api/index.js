const app = require('../backend/dist/app').default;
const { connectDatabase } = require('../backend/dist/config/database');

module.exports = async (req, res) => {
  // Set CORS headers immediately on every request
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Fast preflight response for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Connect to MongoDB Atlas (reusing existing connection pool)
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Serverless database connection error:', err);
  }

  return app(req, res);
};
