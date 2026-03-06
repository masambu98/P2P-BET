import request from 'supertest';
import { app } from '../server.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('P2P Betting Platform - Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testBet: any;

  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.bet.deleteMany({
      where: { creator: { email: { contains: 'test' } } }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await prisma.bet.deleteMany({
      where: { creator: { email: { contains: 'test' } } }
    });
    await prisma.$disconnect();
  });

  describe('Authentication', () => {
    test('POST /api/auth/register - User Registration', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPassword123!',
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body).toHaveProperty('token');

      testUser = response.body.user;
      authToken = response.body.token;
    });

    test('POST /api/auth/login - User Login', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(loginData.email);
    });

    test('GET /api/auth/me - Get Current User', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
    });

    test('POST /api/auth/login - Invalid Credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Wallet Management', () => {
    test('GET /api/wallet/balance - Get Wallet Balance', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(typeof response.body.balance).toBe('number');
    });

    test('POST /api/wallet/deposit - Deposit Funds', async () => {
      const depositData = {
        amount: 10000,
        method: 'mpesa',
        phoneNumber: '+254712345678'
      };

      const response = await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send(depositData)
        .expect(200);

      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.amount).toBe(depositData.amount);
    });

    test('GET /api/wallet/transactions - Get Transaction History', async () => {
      const response = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Betting System', () => {
    test('POST /api/bets - Create Bet', async () => {
      const betData = {
        title: 'Test Bet',
        description: 'This is a test bet for integration testing',
        category: 'Sports',
        stakeAmount: 1000,
        potentialWin: 2000,
        odds: 2.0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const response = await request(app)
        .post('/api/bets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(betData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(betData.title);
      expect(response.body.stakeAmount).toBe(betData.stakeAmount);

      testBet = response.body;
    });

    test('GET /api/bets - Browse Bets', async () => {
      const response = await request(app)
        .get('/api/bets')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('GET /api/bets/:id - Get Bet Details', async () => {
      const response = await request(app)
        .get(`/api/bets/${testBet.id}`)
        .expect(200);

      expect(response.body.id).toBe(testBet.id);
      expect(response.body.title).toBe(testBet.title);
    });

    test('POST /api/bets/:id/accept - Accept Bet', async () => {
      // Create another user to accept the bet
      const secondUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'TestPassword123!',
          fullName: 'Test User 2'
        });

      const secondUserToken = secondUserResponse.body.token;

      // Add funds to second user's wallet
      await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          amount: 5000,
          method: 'mpesa',
          phoneNumber: '+254712345679'
        });

      const response = await request(app)
        .post(`/api/bets/${testBet.id}/accept`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('bet');
      expect(response.body.bet.status).toBe('ACCEPTED');
    });
  });

  describe('Real-time Features', () => {
    test('WebSocket Connection - Authentication', async () => {
      // This would require WebSocket testing library
      // For now, we'll test the REST endpoints that trigger WebSocket events
      const response = await request(app)
        .get('/api/socket/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalConnections');
      expect(response.body).toHaveProperty('uniqueUsers');
    });
  });

  describe('Admin Features', () => {
    test('GET /api/admin/stats - Admin Statistics', async () => {
      // First, make user an admin
      await prisma.user.update({
        where: { id: testUser.id },
        data: { role: 'ADMIN' }
      });

      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalBets');
      expect(response.body).toHaveProperty('totalVolume');
    });

    test('GET /api/admin/users - Get All Users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Analytics', () => {
    test('GET /api/analytics/betting/stats - Betting Analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/betting/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalBets');
      expect(response.body).toHaveProperty('winRate');
      expect(response.body).toHaveProperty('netProfit');
    });
  });

  describe('Security', () => {
    test('Rate Limiting - Exceed Request Limit', async () => {
      const promises = Array(100).fill(null).map(() =>
        request(app)
          .get('/api/bets')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('Invalid Token - Unauthorized Access', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('SQL Injection Protection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .get(`/api/bets?search=${maliciousInput}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should not crash and should return empty or filtered results
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('Response Time - API Endpoints', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/bets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });

    test('Concurrent Requests - Load Handling', async () => {
      const promises = Array(50).fill(null).map(() =>
        request(app)
          .get('/api/bets')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests reasonably
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    test('404 - Not Found', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('Validation Error - Invalid Data', async () => {
      const invalidBetData = {
        title: '', // Empty title should fail validation
        stakeAmount: -1000, // Negative amount should fail
        potentialWin: 'not-a-number' // Invalid type should fail
      };

      const response = await request(app)
        .post('/api/bets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBetData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Database Error - Graceful Handling', async () => {
      // This would require mocking a database error
      // For now, we'll test with invalid ID
      const response = await request(app)
        .get('/api/bets/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Data Integrity', () => {
    test('User Data Consistency', async () => {
      const userResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const walletResponse = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // User should exist and wallet should be accessible
      expect(userResponse.body.id).toBeDefined();
      expect(typeof walletResponse.body.balance).toBe('number');
    });

    test('Bet Data Consistency', async () => {
      const betResponse = await request(app)
        .get(`/api/bets/${testBet.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Bet should have all required fields
      expect(betResponse.body).toHaveProperty('id');
      expect(betResponse.body).toHaveProperty('title');
      expect(betResponse.body).toHaveProperty('stakeAmount');
      expect(betResponse.body).toHaveProperty('status');
    });
  });
});

describe('P2P Betting Platform - E2E Workflows', () => {
  let user1Token: string, user2Token: string;
  let user1: any, user2: any;

  beforeAll(async () => {
    // Create two test users
    const user1Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'e2euser1',
        email: 'e2e1@example.com',
        password: 'TestPassword123!',
        fullName: 'E2E User 1'
      });

    const user2Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'e2euser2',
        email: 'e2e2@example.com',
        password: 'TestPassword123!',
        fullName: 'E2E User 2'
      });

    user1 = user1Response.body.user;
    user2 = user2Response.body.user;
    user1Token = user1Response.body.token;
    user2Token = user2Response.body.token;

    // Add funds to both users
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        amount: 10000,
        method: 'mpesa',
        phoneNumber: '+254712345680'
      });

    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        amount: 10000,
        method: 'mpesa',
        phoneNumber: '+254712345681'
      });
  });

  afterAll(async () => {
    // Clean up E2E test users
    await prisma.user.deleteMany({
      where: { email: { contains: 'e2e' } }
    });
  });

  test('Complete Betting Workflow', async () => {
    // 1. User 1 creates a bet
    const betResponse = await request(app)
      .post('/api/bets')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'E2E Test Bet',
        description: 'Complete workflow test bet',
        category: 'Sports',
        stakeAmount: 2000,
        potentialWin: 4000,
        odds: 2.0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .expect(201);

    const bet = betResponse.body;

    // 2. User 2 browses and finds the bet
    const browseResponse = await request(app)
      .get('/api/bets')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    const foundBet = browseResponse.body.find((b: any) => b.id === bet.id);
    expect(foundBet).toBeDefined();

    // 3. User 2 accepts the bet
    const acceptResponse = await request(app)
      .post(`/api/bets/${bet.id}/accept`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(acceptResponse.body.bet.status).toBe('ACCEPTED');

    // 4. Check wallet balances after bet acceptance
    const user1Wallet = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    const user2Wallet = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    // Balances should be updated (stake amounts held)
    expect(user1Wallet.body.balance).toBeLessThan(8000);
    expect(user2Wallet.body.balance).toBeLessThan(8000);

    // 5. Simulate bet settlement (this would normally be done by admin or automated system)
    await request(app)
      .post(`/api/bets/${bet.id}/settle`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        winner: 'user2', // User 2 wins
        result: 'WON'
      })
      .expect(200);

    // 6. Check final balances
    const finalUser1Wallet = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    const finalUser2Wallet = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    // User 2 should have won (original balance - stake + winnings)
    expect(finalUser2Wallet.body.balance).toBeGreaterThan(finalUser1Wallet.body.balance);

    // 7. Check transaction history
    const user1Transactions = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${user1Token}`)
      .expect(200);

    const user2Transactions = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    expect(user1Transactions.body.length).toBeGreaterThan(0);
    expect(user2Transactions.body.length).toBeGreaterThan(0);
  });

  test('User Profile and Social Features', async () => {
    // 1. User 2 follows User 1
    await request(app)
      .post(`/api/users/${user1.id}/follow`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(200);

    // 2. Check User 1's followers
    const user1Profile = await request(app)
      .get(`/api/users/${user1.username}/profile`)
      .expect(200);

    expect(user1Profile.body.stats.followers).toBe(1);

    // 3. Check User 2's following
    const user2Profile = await request(app)
      .get(`/api/users/${user2.username}/profile`)
      .expect(200);

    expect(user2Profile.body.stats.following).toBe(1);
  });
});
