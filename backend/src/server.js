require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BizAI Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/v1/health`);
});

module.exports = server;
