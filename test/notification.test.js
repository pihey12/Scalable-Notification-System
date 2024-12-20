const request = require('supertest');
const app = require('../src/api/server');

describe('Notification API', () => {
    describe('POST /api/notifications/send', () => {
      it('should queue email notification successfully', async () => {
        const response = await request(app)
          .post('/api/notifications/send')
          .send({
            type: 'email',
            to: 'test@example.com',
            subject: 'Test Subject',
            text: 'Test content'
          });
  
        expect(response.status).toBe(202);
        expect(response.body.success).toBe(true);
      });
  
      it('should queue SMS notification successfully', async () => {
        const response = await request(app)
          .post('/api/notifications/send')
          .send({
            type: 'sms',
            to: '+1234567890',
            text: 'Test SMS'
          });
  
        expect(response.status).toBe(202);
        expect(response.body.success).toBe(true);
      });
  
      it('should return 400 for invalid notification type', async () => {
        const response = await request(app)
          .post('/api/notifications/send')
          .send({
            type: 'invalid',
            to: 'test@example.com',
            text: 'Test'
          });
  
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  
    describe('GET /api/notifications/health', () => {
      it('should return system health status', async () => {
        const response = await request(app)
          .get('/api/notifications/health');
  
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('services');
      });
    });
  });