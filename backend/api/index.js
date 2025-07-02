const app = require('../backend/index'); // or adjust path if needed
const serverless = require('serverless-http');

module.exports = serverless(app);
