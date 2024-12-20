const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Send notification
router.post('/send', notificationController.sendNotification);

// Health check endpoint
router.get('/health', notificationController.getHealth);

module.exports = router; 