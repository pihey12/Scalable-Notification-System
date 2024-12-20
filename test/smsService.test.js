require('dotenv').config();
const smsService = require('../src/services/sms/smsService');
const logger = require('../src/utils/logger');

async function testSMSService() {
  try {
    // Convert local number to E.164 format
    const phoneNumber = '+12183062272';  // Philippines format: +63 + 9-digit number

    // Test 1: Simple SMS
    logger.info('Test 1: Sending simple SMS...');
    const simpleSMS = {
      to: phoneNumber,
      text: 'This is a test SMS from the notification service sent at ' + new Date().toISOString()
    };
    await smsService.sendSMS(simpleSMS);
    logger.info('Test 1: Simple SMS sent successfully');

    // Test 2: SMS with different content
    logger.info('Test 2: Sending second test SMS...');
    const secondSMS = {
      to: phoneNumber,
      text: 'Second test message to verify SMS service functionality. Sent at: ' + new Date().toISOString()
    };
    await smsService.sendSMS(secondSMS);
    logger.info('Test 2: Second SMS sent successfully');

    // Test 3: Long SMS
    logger.info('Test 3: Sending long SMS...');
    const longSMS = {
      to: phoneNumber,
      text: 'This is a longer test message to verify that the SMS service can handle messages that might be split into multiple parts. Testing character limits and message splitting functionality. Sent at: ' + new Date().toISOString()
    };
    await smsService.sendSMS(longSMS);
    logger.info('Test 3: Long SMS sent successfully');

    logger.info('All SMS tests completed successfully!');

  } catch (error) {
    logger.error('Error during SMS testing:', error);
    process.exit(1);
  }
}

// Run all tests
testSMSService().then(() => {
  logger.info('SMS service testing completed');
}).catch((error) => {
  logger.error('Fatal error during testing:', error);
  process.exit(1);
});