let cachedApp;
let cachedConnectDatabase;

function getBackend() {
  if (!cachedApp) {
    const backendModule = require('../backend/dist/app');
    cachedApp = backendModule.default || backendModule;
    const dbModule = require('../backend/dist/config/database');
    cachedConnectDatabase = dbModule.connectDatabase;
  }
  return { app: cachedApp, connectDatabase: cachedConnectDatabase };
}

module.exports = async (req, res) => {
  // Set CORS headers immediately on every incoming request
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle CORS preflight requests instantly
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { app, connectDatabase } = getBackend();

    try {
      await connectDatabase();
    } catch (dbErr) {
      console.error('Database connection error in serverless handler:', dbErr);
    }

    return app(req, res);
  } catch (err) {
    console.error('Serverless function error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error: ' + (err.message || 'Internal server error'),
    });
  }
};
