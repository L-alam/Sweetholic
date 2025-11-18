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

describe('User Profile API', () => {
  let authToken1: string;
  let authToken2: string;

  // Setup: Create test users before each test
  beforeEach(async () => {
    await clearDatabase();
    
    // Create first user
    const response1 = await request(app)
      .post('/api/auth/signup')
      .send(testUser1);
    authToken1 = response1.body.data.token;

    // Create second user
    const response2 = await request(app)
      .post('/api/auth/signup')
      .send(testUser2);
    authToken2 = response2.body.data.token;
  });

  describe('GET /api/users/:username - Get User Profile', () => {
    it('should get a user profile by username', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(testUser1.username);
      expect(response.body.data.user.display_name).toBe(testUser1.display_name);
      expect(response.body.data.user).toHaveProperty('post_count');
      expect(response.body.data.user).toHaveProperty('follower_count');
      expect(response.body.data.user).toHaveProperty('following_count');
      expect(response.body.data.user.email).toBeUndefined(); // Email should not be exposed
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistentuser')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should show following status when authenticated', async () => {
      // User 1 follows User 2
      await request(app)
        .post(`/api/follows/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send();

      // Check User 2's profile as User 1
      const response = await request(app)
        .get(`/api/users/${testUser2.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.data.user.is_following).toBe(true);
    });
  });

  describe('PUT /api/users/profile - Update User Profile', () => {
    it('should update user profile with valid data', async () => {
      const updates = {
        display_name: 'New Display Name',
        bio: 'I love sweet treats!',
        profile_photo_url: 'https://example.com/photo.jpg',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.display_name).toBe(updates.display_name);
      expect(response.body.data.user.bio).toBe(updates.bio);
      expect(response.body.data.user.profile_photo_url).toBe(updates.profile_photo_url);
    });

    it('should update partial profile data', async () => {
      const updates = {
        bio: 'Just updating my bio',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken1}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.bio).toBe(updates.bio);
      expect(response.body.data.user.display_name).toBe(testUser1.display_name); // Should remain unchanged
    });

    it('should fail without authentication', async () => {
      const updates = {
        display_name: 'New Name',
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updates)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with no fields to update', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No fields to update');
    });
  });

  describe('DELETE /api/users/account - Delete User Account', () => {
    it('should delete user account when authenticated', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify user is deleted
      const profileCheck = await request(app)
        .get(`/api/users/${testUser1.username}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete('/api/users/account')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users - Search Users', () => {
    it('should search users by username', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ q: 'sweet' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.users[0].username).toContain('sweet');
    });

    it('should search users by display name', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ q: 'Dessert' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users.some((u: any) => 
        u.display_name.includes('Dessert')
      )).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ q: 'user', limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.offset).toBe(0);
    });

    it('should fail without search query', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/users/:username/stats - Get User Stats', () => {
    it('should get user statistics', async () => {
      const response = await request(app)
        .get(`/api/users/${testUser1.username}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('total_posts');
      expect(response.body.data.stats).toHaveProperty('total_photos');
      expect(response.body.data.stats).toHaveProperty('follower_count');
      expect(response.body.data.stats).toHaveProperty('following_count');
      expect(response.body.data.stats).toHaveProperty('total_reactions_received');
      expect(response.body.data.stats).toHaveProperty('total_comments_received');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent/stats')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});