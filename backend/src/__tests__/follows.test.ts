import request from 'supertest';
import app from '../server';
import { clearDatabase } from './setup';

// Test data
const testUser1 = {
  username: 'sweetlover',
  email: 'sweet@example.com',
  password: 'password123',
  display_name: 'Sweet Lover',
};

const testUser2 = {
  username: 'dessertfan',
  email: 'dessert@example.com',
  password: 'password123',
  display_name: 'Dessert Fan',
};

const testUser3 = {
  username: 'cakeboss',
  email: 'cake@example.com',
  password: 'password123',
  display_name: 'Cake Boss',
};

describe('Follows API', () => {
  let authToken1: string;
  let authToken2: string;
  let authToken3: string;

  // Setup: Create test users before each test
  beforeEach(async () => {
    await clearDatabase();
    
    // Create users
    const response1 = await request(app)
      .post('/api/auth/signup')
      .send(testUser1);
    authToken1 = response1.body.data.token;

    const response2 = await request(app)
      .post('/api/auth/signup')
      .send(testUser2);
    authToken2 = response2.body.data.token;

    const response3 = await request(app)
      .post('/api/auth/signup')
      .send(testUser3);
    authToken3 = response3.body.data.token;
  });

  describe('POST /api/follows/:username - Follow User', () => {
    it('should follow a user successfully', async () => {
      const response = await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully followed');
      expect(response.body.data.following.username).toBe(testUser2.username);
    });

    it('should fail when trying to follow yourself', async () => {
      const response = await request(app)
        .post(`/api/follows/${testUser1.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot follow yourself');
    });

    it('should fail when trying to follow the same user twice', async () => {
      // Follow once
      await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      // Try to follow again
      const response = await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Already following');
    });

    it('should fail when following non-existent user', async () => {
      const response = await request(app)
        .post('/api/follows/nonexistentuser')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should update follower/following counts', async () => {
      // User 1 follows User 2
      await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      // Check User 2's profile (should have 1 follower)
      const user2Profile = await request(app)
        .get(`/api/users/${testUser2.username}`)
        .expect(200);

      expect(user2Profile.body.data.user.follower_count).toBe(1);

      // Check User 1's profile (should be following 1)
      const user1Profile = await request(app)
        .get(`/api/users/${testUser1.username}`)
        .expect(200);

      expect(user1Profile.body.data.user.following_count).toBe(1);
    });
  });

  describe('DELETE /api/follows/:username - Unfollow User', () => {
    beforeEach(async () => {
      // User 1 follows User 2
      await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);
    });

    it('should unfollow a user successfully', async () => {
      const response = await request(app)
        .delete(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Successfully unfollowed');
      expect(response.body.data.unfollowed.username).toBe(testUser2.username);
    });

    it('should fail when trying to unfollow yourself', async () => {
      const response = await request(app)
        .delete(`/api/follows/${testUser1.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot unfollow yourself');
    });

    it('should fail when trying to unfollow a user you are not following', async () => {
      const response = await request(app)
        .delete(`/api/follows/${testUser3.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not following');
    });

    it('should fail when unfollowing non-existent user', async () => {
      const response = await request(app)
        .delete('/api/follows/nonexistentuser')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/follows/${testUser2.username}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should update follower/following counts after unfollowing', async () => {
      // Unfollow
      await request(app)
        .delete(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      // Check User 2's profile (should have 0 followers)
      const user2Profile = await request(app)
        .get(`/api/users/${testUser2.username}`)
        .expect(200);

      expect(user2Profile.body.data.user.follower_count).toBe(0);

      // Check User 1's profile (should be following 0)
      const user1Profile = await request(app)
        .get(`/api/users/${testUser1.username}`)
        .expect(200);

      expect(user1Profile.body.data.user.following_count).toBe(0);
    });
  });

  describe('GET /api/follows/:username/followers - Get Followers', () => {
    beforeEach(async () => {
      // User 1 and User 3 follow User 2
      await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .expect(201);
    });

    it('should get list of followers', async () => {
      const response = await request(app)
        .get(`/api/follows/${testUser2.username}/followers`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.followers).toBeInstanceOf(Array);
      expect(response.body.data.followers.length).toBe(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/follows/${testUser2.username}/followers`)
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data.followers.length).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.offset).toBe(0);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should return empty array for user with no followers', async () => {
      const response = await request(app)
        .get(`/api/follows/${testUser1.username}/followers`)
        .expect(200);

      expect(response.body.data.followers).toBeInstanceOf(Array);
      expect(response.body.data.followers.length).toBe(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should fail for non-existent user', async () => {
      const response = await request(app)
        .get('/api/follows/nonexistentuser/followers')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/follows/:username/following - Get Following', () => {
    beforeEach(async () => {
      // User 1 follows User 2 and User 3
      await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      await request(app)
        .post(`/api/follows/${testUser3.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);
    });

    it('should get list of users being followed', async () => {
      const response = await request(app)
        .get(`/api/follows/${testUser1.username}/following`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.following).toBeInstanceOf(Array);
      expect(response.body.data.following.length).toBe(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/follows/${testUser1.username}/following`)
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data.following.length).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.offset).toBe(0);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should return empty array for user not following anyone', async () => {
      const response = await request(app)
        .get(`/api/follows/${testUser2.username}/following`)
        .expect(200);

      expect(response.body.data.following).toBeInstanceOf(Array);
      expect(response.body.data.following.length).toBe(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should fail for non-existent user', async () => {
      const response = await request(app)
        .get('/api/follows/nonexistentuser/following')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});