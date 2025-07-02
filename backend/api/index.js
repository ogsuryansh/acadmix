const app = require('../backend/index'); // adjust path if needed
const serverless = require('serverless-http');

module.exports = serverless(app);
