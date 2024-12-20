require('dotenv').config();
const emailService = require('../src/services/email/emailService');
const logger = require('../src/utils/logger');

async function testEmail() {
  try {
    const testNotification = {
      to: 'pj.superable@gmail.com', // Your email address
      subject: 'Test Email from Notification Service',
      text: 'This is a test email sent at ' + new Date().toISOString(),
      html: `
        <h1>Test Email</h1>
        <p>This is a test email sent at ${new Date().toISOString()}</p>
        <p>If you receive this, the email service is working correctly!</p>
      `
    };

    logger.info('Sending test email...');
    const result = await emailService.sendEmail(testNotification);
    logger.info('Test email sent successfully:', result);
  } catch (error) {
    logger.error('Error sending test email:', error);
    process.exit(1);
  }
}

testEmail();