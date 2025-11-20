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

describe('Reactions API', () => {
  let authToken1: string;
  let authToken2: string;
  let postId: string;

  // Setup: Create test users and a post
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

    // Create a post
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({
        caption: 'Delicious chocolate cake!',
        rating: 5,
      });
    postId = postResponse.body.data.post.id;
  });

  describe('POST /api/reactions/:postId - Add Reaction', () => {
    it('should add a reaction to a post', async () => {
      const response = await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reaction.reaction_type).toBe('heart');
      expect(response.body.data.reaction.post_id).toBe(postId);
    });

    it('should allow multiple different reactions from same user', async () => {
      // Add heart reaction
      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' })
        .expect(201);

      // Add thumbs_up reaction
      const response = await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'thumbs_up' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should fail when adding duplicate reaction type', async () => {
      // Add reaction
      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' })
        .expect(201);

      // Try to add same reaction again
      const response = await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already reacted');
    });

    it('should fail with invalid reaction type', async () => {
      const response = await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'invalid_reaction' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid reaction type');
    });

    it('should fail without reaction type', async () => {
      const response = await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-existent post', async () => {
      const response = await request(app)
        .post('/api/reactions/99999')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Post not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/reactions/${postId}`)
        .send({ reaction_type: 'heart' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/reactions/:postId/:reactionType - Remove Reaction', () => {
    beforeEach(async () => {
      // Add a reaction to remove
      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' });
    });

    it('should remove a reaction from a post', async () => {
      const response = await request(app)
        .delete(`/api/reactions/${postId}/heart`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
    });

    it('should fail when removing non-existent reaction', async () => {
      const response = await request(app)
        .delete(`/api/reactions/${postId}/thumbs_up`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Reaction not found');
    });

    it('should fail with invalid reaction type', async () => {
      const response = await request(app)
        .delete(`/api/reactions/${postId}/invalid_reaction`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid reaction type');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/reactions/${postId}/heart`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reactions/:postId - Get Post Reactions', () => {
    beforeEach(async () => {
      // Add multiple reactions
      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ reaction_type: 'heart' });

      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' });

      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'thumbs_up' });
    });

    it('should get all reactions for a post', async () => {
      const response = await request(app)
        .get(`/api/reactions/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_reactions).toBe(3);
      expect(response.body.data.reaction_counts.heart).toBe(2);
      expect(response.body.data.reaction_counts.thumbs_up).toBe(1);
    });

    it('should show user reactions when authenticated', async () => {
      const response = await request(app)
        .get(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.data.user_reactions).toContain('heart');
      expect(response.body.data.user_reactions).toContain('thumbs_up');
      expect(response.body.data.user_reactions.length).toBe(2);
    });

    it('should work without authentication', async () => {
      const response = await request(app)
        .get(`/api/reactions/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_reactions).toEqual([]);
    });

    it('should fail for non-existent post', async () => {
      const response = await request(app)
        .get('/api/reactions/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/reactions/:postId/:reactionType/users - Get Reaction Users', () => {
    beforeEach(async () => {
      // Add reactions
      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ reaction_type: 'heart' });

      await request(app)
        .post(`/api/reactions/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ reaction_type: 'heart' });
    });

    it('should get users who reacted with specific type', async () => {
      const response = await request(app)
        .get(`/api/reactions/${postId}/heart/users`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBe(2);
      expect(response.body.data.users[0]).toHaveProperty('username');
      expect(response.body.data.users[0]).toHaveProperty('reacted_at');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/reactions/${postId}/heart/users`)
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data.users.length).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should return empty array for reaction type with no users', async () => {
      const response = await request(app)
        .get(`/api/reactions/${postId}/jealous/users`)
        .expect(200);

      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBe(0);
    });

    it('should fail with invalid reaction type', async () => {
      const response = await request(app)
        .get(`/api/reactions/${postId}/invalid_reaction/users`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-existent post', async () => {
      const response = await request(app)
        .get('/api/reactions/99999/heart/users')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});