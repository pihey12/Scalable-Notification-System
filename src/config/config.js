require('dotenv').config();

const config = {
  port: process.env.API_PORT || 4000,
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672'
  },
  email: {
    host: 'smtp.office365.com',
    port: 587,
    from: {
      name: process.env.SMTP_FROM_NAME || 'Notification Service',
      email: process.env.SMTP_USER
    },
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_APP_PASSWORD
    }
  },
  sms: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  }
};

// Validate configurations based on service type
const validateConfig = (serviceType) => {
  let requiredVars = {};

  switch (serviceType) {
    case 'email':
      requiredVars = {
        'SMTP User': config.email.auth.user,
        'SMTP Password': config.email.auth.pass
      };
      break;
    case 'sms':
      requiredVars = {
        'Twilio Account SID': config.sms.accountSid,
        'Twilio Auth Token': config.sms.authToken,
        'Twilio Phone Number': config.sms.phoneNumber
      };
      break;
    case 'api':
      requiredVars = {
        'RabbitMQ URL': config.rabbitmq.url,
        'API Port': config.port
      };
      break;
    default:
      requiredVars = {
        'RabbitMQ URL': config.rabbitmq.url
      };
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVars.length > 0) {
    console.warn(`[${serviceType.toUpperCase()}] Missing configuration: ${missingVars.join(', ')}`);
    return false;
  }

  return true;
};

// Export both config and validation function
module.exports = {
  config,
  validateConfig
};