const nodemailer = require('nodemailer');
const { config, validateConfig } = require('../../config/config');
const logger = require('../../utils/logger');

class EmailService {
  constructor() {
    this.isEnabled = validateConfig('email');

    if (!this.isEnabled) {
      logger.warn('Email service will be disabled due to missing configuration');
      return;
    }

    // Configure for Gmail with app password
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.auth.user, // Gmail address
        pass: config.email.auth.pass  // Gmail app password
      }
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('SMTP connection error:', error);
      } else {
        logger.info('SMTP server is ready');
      }
    });
  }

  async sendEmail(notification) {
    if (!this.isEnabled) {
      throw new Error('Email service is not properly configured');
    }

    try {
      const mailOptions = {
        from: `"${config.email.from.name}" <${config.email.auth.user}>`, // sender address
        to: notification.to,
        subject: notification.subject,
        text: notification.text,
        html: notification.html
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }
}

// Create and export a single instance
const emailService = new EmailService();
module.exports = emailService; 