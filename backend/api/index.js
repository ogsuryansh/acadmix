const app = require('../backend/index'); // adjust path if needed
const serverless = require('serverless-http');

// Optional: wrap with error handling if needed
module.exports = async (req, res) => {
  try {
    const handler = serverless(app);
    return handler(req, res);
  } catch (err) {
    console.error('❌ Serverless function error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
