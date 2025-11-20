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

describe('Comments API', () => {
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

  describe('POST /api/comments/:postId - Create Comment', () => {
    it('should create a comment on a post', async () => {
      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'This looks amazing!' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe('This looks amazing!');
      expect(response.body.data.comment.post_id).toBe(postId);
      expect(response.body.data.comment.user).toHaveProperty('username');
      expect(response.body.data.comment.user.username).toBe(testUser2.username);
    });

    it('should trim whitespace from comment content', async () => {
      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: '  Great post!  ' })
        .expect(201);

      expect(response.body.data.comment.content).toBe('Great post!');
    });

    it('should fail with empty content', async () => {
      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail with whitespace-only content', async () => {
      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with content over 1000 characters', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: longContent })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('1000 characters');
    });

    it('should fail for non-existent post', async () => {
      const response = await request(app)
        .post('/api/comments/99999')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Nice post!' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Post not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .send({ content: 'Nice post!' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow same user to comment multiple times', async () => {
      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'First comment' })
        .expect(201);

      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Second comment' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/comments/:commentId - Update Comment', () => {
    let commentId: string;

    beforeEach(async () => {
      // Create a comment to update
      const commentResponse = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Original comment' });
      commentId = commentResponse.body.data.comment.id;
    });

    it('should update a comment', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Updated comment' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comment.content).toBe('Updated comment');
      expect(response.body.data.comment.updated_at).toBeTruthy();
    });

    it('should fail when updating someone elses comment', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Trying to update' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail with empty content', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with content over 1000 characters', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: longContent })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-existent comment', async () => {
      const response = await request(app)
        .put('/api/comments/99999')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/comments/${commentId}`)
        .send({ content: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/comments/:commentId - Delete Comment', () => {
    let commentId: string;

    beforeEach(async () => {
      // Create a comment to delete
      const commentResponse = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Comment to delete' });
      commentId = commentResponse.body.data.comment.id;
    });

    it('should delete a comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify comment is deleted
      const getResponse = await request(app)
        .get(`/api/comments/post/${postId}`)
        .expect(200);

      expect(getResponse.body.data.comments.length).toBe(0);
    });

    it('should fail when deleting someone elses comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/comments/99999')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/comments/post/:postId - Get Post Comments', () => {
    beforeEach(async () => {
      // Create multiple comments
      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'First comment' });

      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Second comment' });

      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'Third comment' });
    });

    it('should get all comments for a post', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeInstanceOf(Array);
      expect(response.body.data.comments.length).toBe(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should include user info in comments', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${postId}`)
        .expect(200);

      const comment = response.body.data.comments[0];
      expect(comment).toHaveProperty('user');
      expect(comment.user).toHaveProperty('username');
      expect(comment.user).toHaveProperty('display_name');
      expect(comment.user).toHaveProperty('profile_photo_url');
    });

    it('should return comments in chronological order (oldest first)', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${postId}`)
        .expect(200);

      const comments = response.body.data.comments;
      expect(comments[0].content).toBe('First comment');
      expect(comments[1].content).toBe('Second comment');
      expect(comments[2].content).toBe('Third comment');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${postId}`)
        .query({ limit: 2, offset: 0 })
        .expect(200);

      expect(response.body.data.comments.length).toBe(2);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should return empty array for post with no comments', async () => {
      // Create a new post with no comments
      const newPostResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ caption: 'New post', rating: 4 });

      const response = await request(app)
        .get(`/api/comments/post/${newPostResponse.body.data.post.id}`)
        .expect(200);

      expect(response.body.data.comments).toBeInstanceOf(Array);
      expect(response.body.data.comments.length).toBe(0);
    });

    it('should fail for non-existent post', async () => {
      const response = await request(app)
        .get('/api/comments/post/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/comments/user/:username - Get User Comments', () => {
    beforeEach(async () => {
      // User 2 creates multiple comments
      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'First comment' });

      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ content: 'Second comment' });

      // User 1 also comments
      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ content: 'User 1 comment' });
    });

    it('should get all comments by a user', async () => {
      const response = await request(app)
        .get(`/api/comments/user/${testUser2.username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.comments).toBeInstanceOf(Array);
      expect(response.body.data.comments.length).toBe(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should return comments in reverse chronological order (newest first)', async () => {
      const response = await request(app)
        .get(`/api/comments/user/${testUser2.username}`)
        .expect(200);

      const comments = response.body.data.comments;
      expect(comments[0].content).toBe('Second comment');
      expect(comments[1].content).toBe('First comment');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/comments/user/${testUser2.username}`)
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data.comments.length).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should return empty array for user with no comments', async () => {
      // Create a new user who hasn't commented
      const newUser = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        display_name: 'New User',
      };
      await request(app).post('/api/auth/signup').send(newUser);

      const response = await request(app)
        .get(`/api/comments/user/${newUser.username}`)
        .expect(200);

      expect(response.body.data.comments).toBeInstanceOf(Array);
      expect(response.body.data.comments.length).toBe(0);
    });

    it('should fail for non-existent user', async () => {
      const response = await request(app)
        .get('/api/comments/user/nonexistentuser')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});