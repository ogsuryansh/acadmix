const app = require('../backend/server'); // adjust path if needed
const serverless = require('serverless-http');

module.exports = serverless(app);
