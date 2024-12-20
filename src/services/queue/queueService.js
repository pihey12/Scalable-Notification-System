const amqp = require('amqplib');
const { config } = require('../../config/config');
const logger = require('../../utils/logger');

class QueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.url = config.rabbitmq?.url || 'amqp://rabbitmq:5672';
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      logger.info('Successfully connected to RabbitMQ');
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error.message);
      throw error;
    }
  }

  async reconnect() {
    try {
      await this.connect();
    } catch (error) {
      logger.error('Failed to reconnect to RabbitMQ:', error);
      // Retry connection after delay
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  async publishNotification(type, notification) {
    try {
      if (!this.channel) {
        throw new Error('Queue service not connected');
      }

      const queue = this.queues[type];
      if (!queue) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      const message = {
        ...notification,
        timestamp: new Date().toISOString(),
        attempts: 0
      };

      const success = this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          messageId: `${type}_${Date.now()}`,
          headers: {
            'content-type': 'application/json'
          }
        }
      );

      if (success) {
        logger.info(`Message published to queue: ${queue}`, {
          type,
          to: notification.to
        });
      } else {
        throw new Error('Failed to publish message');
      }

      return success;
    } catch (error) {
      logger.error('Error publishing message:', error);
      throw error;
    }
  }

  async consumeNotifications(type, handler) {
    try {
      if (!this.channel) {
        throw new Error('Queue service not connected');
      }

      const queue = this.queues[type];
      if (!queue) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      await this.channel.prefetch(1); // Process one message at a time

      await this.channel.consume(queue, async (message) => {
        if (!message) return;

        try {
          const notification = JSON.parse(message.content.toString());
          logger.info(`Processing ${type} notification`, {
            messageId: message.properties.messageId
          });

          await handler(notification);
          this.channel.ack(message);

        } catch (error) {
          logger.error(`Error processing ${type} notification:`, error);
          
          // Check retry count
          const notification = JSON.parse(message.content.toString());
          if (notification.attempts >= 3) {
            // Dead letter after max retries
            this.channel.ack(message);
            logger.error(`Message failed after max retries`, {
              messageId: message.properties.messageId,
              type
            });
          } else {
            // Requeue with incremented attempt count
            notification.attempts += 1;
            this.channel.nack(message, false, false);
            await this.publishNotification(type, notification);
          }
        }
      });

      logger.info(`Consuming messages from queue: ${queue}`);
    } catch (error) {
      logger.error('Error setting up consumer:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      logger.info('Queue service connections closed');
    } catch (error) {
      logger.error('Error closing queue connections:', error);
      throw error;
    }
  }

  // Health check method
  async checkHealth() {
    try {
      if (!this.connection || !this.channel) {
        return {
          status: 'unhealthy',
          service: 'queue',
          error: 'Not connected to RabbitMQ',
          timestamp: new Date().toISOString()
        };
      }

      return {
        status: 'healthy',
        service: 'queue',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'queue',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new QueueService(); 