const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const corsOptions = require('./config/cors');
const { initializeFirebase } = require('./config/firebase-admin');
const { initializeSocket } = require('./socket');
const { globalLimiter } = require('./middleware/rate-limit');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const agentRoutes = require('./routes/agent.routes');
const requestRoutes = require('./routes/request.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);
app.set('io', io);

// Initialize Firebase Admin SDK
initializeFirebase();

// CORS — must be before helmet so preflight responses get proper headers
app.use(cors(corsOptions));

// Security middleware
app.set('trust proxy', 1); // Trust first proxy (Render load balancer)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: err.code === 'LIMIT_FILE_SIZE'
        ? 'File too large. Maximum 5MB allowed.'
        : err.message,
    });
  }

  res.status(err.status || 500).json({
    error: env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// Start server
const PORT = env.PORT;
server.listen(PORT, () => {
  logger.info(`🚀 ParcelSafe API running on port ${PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Frontend URL: ${env.FRONTEND_URL}`);
});

module.exports = { app, server };
