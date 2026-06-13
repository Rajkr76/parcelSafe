const cors = require('cors');
const env = require('./env');

const corsOptions = {
  origin: [env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
