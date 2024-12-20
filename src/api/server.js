const express = require('express');
const cors = require('cors');
const { config, validateConfig } = require('../config/config');
const logger = require('../utils/logger');
const notificationRoutes = require('./routes/notificationRoutes');
const queueService = require('../services/queue/queueService');
const rateLimit = require('express-rate-limit');
const prometheus = require('prom-client');

// Validate API configuration
if (!validateConfig('api')) {
  logger.error('Missing required API configuration');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Routes
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Initialize metrics
const httpRequestDurationMicroseconds = new prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code']
});

// Add metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

// Initialize services and start server
async function startServer() {
  try {
    // Add retry logic for RabbitMQ connection
    let retries = 5;
    while (retries > 0) {
      try {
        await queueService.connect();
        break; // Connection successful
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error; // No more retries left
        }
        logger.warn(`Failed to connect to RabbitMQ. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
      }
    }

    const port = config.port || 4000;
    app.listen(port, '0.0.0.0', () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Add graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  queueService.disconnect()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    });
});

startServer();

module.exports = app; // For testing purposes 