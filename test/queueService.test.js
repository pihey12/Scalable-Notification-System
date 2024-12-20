const { QueueService } = require("../src/services/queueService");

describe('QueueService', () => {
    beforeAll(async () => {
      await QueueService.connect();
    });
  
    afterAll(async () => {
      await QueueService.close();
    });
  
    describe('publishNotification', () => {
      it('should publish email notification successfully', async () => {
        const notification = {
          to: 'test@example.com',
          subject: 'Test Subject',
          text: 'Test content'
        };
  
        const result = await QueueService.publishNotification('email', notification);
        expect(result).toBe(true);
      });
  
      it('should publish SMS notification successfully', async () => {
        const notification = {
          to: '+1234567890',
          text: 'Test SMS'
        };
  
        const result = await QueueService.publishNotification('sms', notification);
        expect(result).toBe(true);
      });
  
      it('should throw error for invalid notification type', async () => {
        const notification = {
          to: 'test@example.com',
          text: 'Test'
        };
  
        await expect(
          QueueService.publishNotification('invalid_type', notification)
        ).rejects.toThrow('Invalid notification type');
      });
    });
  
    describe('checkHealth', () => {
      it('should return healthy status when connected', async () => {
        const health = await QueueService.checkHealth();
        expect(health.status).toBe('healthy');
        expect(health.service).toBe('queue');
      });
    });
  });