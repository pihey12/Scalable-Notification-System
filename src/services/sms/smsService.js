const twilio = require('twilio');
const { config, validateConfig } = require('../../config/config');
const logger = require('../../utils/logger');

class SMSService {
  constructor() {
    this.isEnabled = validateConfig('sms');

    if (!this.isEnabled) {
      logger.warn('SMS service will be disabled due to missing configuration');
      return;
    }

    try {
      this.client = twilio(
        config.sms.accountSid,
        config.sms.authToken
      );
      this.phoneNumber = config.sms.phoneNumber;
      logger.info('SMS service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SMS service:', error);
      this.isEnabled = false;
    }
  }

  async sendSMS(notification) {
    if (!this.isEnabled) {
      throw new Error('SMS service is not properly configured');
    }

    const { to, text } = notification;
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        const message = await this.client.messages.create({
          body: text,
          from: this.phoneNumber,
          to: to
        });

        logger.info('SMS sent successfully', {
          messageId: message.sid,
          to,
          status: message.status
        });

        return {
          success: true,
          messageId: message.sid,
          attempts: attempts + 1,
          status: message.status
        };

      } catch (error) {
        attempts++;
        logger.error('Error sending SMS', {
          error: error.message,
          attempt: attempts,
          to
        });

        if (attempts === maxRetries) {
          throw new Error(`Failed to send SMS after ${maxRetries} attempts: ${error.message}`);
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.min(1000 * Math.pow(2, attempts), 10000))
        );
      }
    }
  }

  // Method to handle notifications from the queue
  async handleNotification(notification) {
    try {
      this.validateSMSNotification(notification);
      const result = await this.sendSMS(notification);
      return result;
    } catch (error) {
      logger.error('Failed to process SMS notification', {
        error: error.message,
        notification
      });
      throw error;
    }
  }

  // Method to validate SMS notification data
  validateSMSNotification(notification) {
    const requiredFields = ['to', 'text'];
    const missingFields = requiredFields.filter(field => !notification[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(notification.to)) {
      throw new Error('Invalid phone number format. Must be in E.164 format (e.g., +1234567890)');
    }

    // Check message length
    if (notification.text.length > 1600) {
      throw new Error('SMS message too long. Must be 1600 characters or less');
    }

    return true;
  }

  // Method to check service health
  async checkHealth() {
    return {
      status: this.isEnabled ? 'healthy' : 'disabled',
      service: 'sms',
      configured: this.isEnabled,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SMSService(); 