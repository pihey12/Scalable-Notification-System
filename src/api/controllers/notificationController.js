const emailService = require('../../services/email/emailService');
const smsService = require('../../services/sms/smsService');
const queueService = require('../../services/queue/queueService');
const logger = require('../../utils/logger');

class NotificationController {
  async sendNotification(req, res) {
    try {
      const { type, ...notificationData } = req.body;

      // Validate request
      if (!type || !['email', 'sms'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid notification type. Must be either "email" or "sms"'
        });
      }

      // Validate notification data based on type
      try {
        if (type === 'email') {
          emailService.validateEmailNotification(notificationData);
        } else {
          smsService.validateSMSNotification(notificationData);
        }
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError.message
        });
      }

      // Publish to queue
      await queueService.publishNotification(type, notificationData);

      res.status(202).json({
        success: true,
        message: 'Notification queued successfully',
        type,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error processing notification request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process notification request'
      });
    }
  }

  async getHealth(req, res) {
    try {
      const [queueHealth, emailHealth, smsHealth] = await Promise.all([
        queueService.checkHealth(),
        emailService.checkHealth(),
        smsService.checkHealth()
      ]);

      const systemHealth = {
        status: queueHealth.status === 'healthy' && 
                emailHealth.status === 'healthy' && 
                smsHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          queue: queueHealth,
          email: emailHealth,
          sms: smsHealth
        }
      };

      res.status(200).json(systemHealth);
    } catch (error) {
      logger.error('Error checking system health:', error);
      res.status(500).json({
        status: 'error',
        error: 'Failed to check system health'
      });
    }
  }
}

module.exports = new NotificationController(); 