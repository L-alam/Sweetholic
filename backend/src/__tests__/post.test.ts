import request from 'supertest';
import app from '../server';
import { clearDatabase } from './setup';

// Test data
const testUser = {
  username: 'postuser',
  email: 'post@example.com',
  password: 'password123',
  display_name: 'Post User',
};

const testPost = {
  caption: 'Delicious chocolate cake!',
  location: 'Sweet Bakery',
  rating: 5,
};

describe('Posts API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await clearDatabase();
    
    // Create user and get token
    const response = await request(app)
      .post('/api/auth/signup')
      .send(testUser);
    
    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  describe('POST /api/posts - Create Post', () => {
    it('should create a post with all fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPost)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post created successfully');
      expect(response.body.data.post).toHaveProperty('id');
      expect(response.body.data.post.caption).toBe(testPost.caption);
      expect(response.body.data.post.location).toBe(testPost.location);
      expect(response.body.data.post.rating).toBe(testPost.rating);
      expect(response.body.data.post.user_id).toBe(userId);
    });

    it('should create a post with only caption', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ caption: 'Just a caption' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.caption).toBe('Just a caption');
      expect(response.body.data.post.location).toBeNull();
      expect(response.body.data.post.rating).toBeNull();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send(testPost)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid rating', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...testPost, rating: 6 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Rating must be between 1 and 5');
    });
  });

  describe('GET /api/posts/:postId - Get Single Post', () => {
    let postId: string;

    beforeEach(async () => {
      // Create a post first
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPost);
      
      postId = response.body.data.post.id;
    });

    it('should get a post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.id).toBe(postId);
      expect(response.body.data.post.caption).toBe(testPost.caption);
      expect(response.body.data.post.user.username).toBe(testUser.username);
      expect(response.body.data.post).toHaveProperty('photo_count');
      expect(response.body.data.post).toHaveProperty('reaction_count');
      expect(response.body.data.post).toHaveProperty('comment_count');
      expect(response.body.data.post).toHaveProperty('photos');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Post not found');
    });
  });

  describe('PUT /api/posts/:postId - Update Post', () => {
    let postId: string;

    beforeEach(async () => {
      // Create a post first
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPost);
      
      postId = response.body.data.post.id;
    });

    it('should update post caption', async () => {
      const updates = { caption: 'Updated caption!' };
      
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.caption).toBe(updates.caption);
      expect(response.body.data.post.location).toBe(testPost.location);
    });

    it('should update multiple fields', async () => {
      const updates = {
        caption: 'New caption',
        location: 'New location',
        rating: 4,
      };
      
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.post.caption).toBe(updates.caption);
      expect(response.body.data.post.location).toBe(updates.location);
      expect(response.body.data.post.rating).toBe(updates.rating);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ caption: 'Trying to update' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail when updating another user\'s post', async () => {
      // Create another user
      const anotherUser = {
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
      };
      
      const userResponse = await request(app)
        .post('/api/auth/signup')
        .send(anotherUser);
      
      const anotherToken = userResponse.body.data.token;

      // Try to update first user's post
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ caption: 'Trying to hijack' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should fail with invalid rating', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with no fields to update', async () => {
      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No fields to update');
    });
  });

  describe('DELETE /api/posts/:postId - Delete Post', () => {
    let postId: string;

    beforeEach(async () => {
      // Create a post first
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testPost);
      
      postId = response.body.data.post.id;
    });

    it('should delete own post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify post is deleted
      await request(app)
        .get(`/api/posts/${postId}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail when deleting another user\'s post', async () => {
      // Create another user
      const anotherUser = {
        username: 'anotheruser2',
        email: 'another2@example.com',
        password: 'password123',
      };
      
      const userResponse = await request(app)
        .post('/api/auth/signup')
        .send(anotherUser);
      
      const anotherToken = userResponse.body.data.token;

      // Try to delete first user's post
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authorized');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .delete(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/posts/user/:username - Get User Posts', () => {
    beforeEach(async () => {
      // Create multiple posts
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ caption: 'Post 1', rating: 5 });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ caption: 'Post 2', rating: 4 });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ caption: 'Post 3', rating: 3 });
    });

    it('should get all posts by user', async () => {
      const response = await request(app)
        .get(`/api/posts/user/${testUser.username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.posts.length).toBe(3);
      expect(response.body.data.posts[0]).toHaveProperty('caption');
      expect(response.body.data.posts[0]).toHaveProperty('photos');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/posts/user/${testUser.username}`)
        .query({ limit: 2, offset: 0 })
        .expect(200);

      expect(response.body.data.posts.length).toBe(2);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.offset).toBe(0);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/posts/user/nonexistentuser')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/posts/feed - Get Feed', () => {
    beforeEach(async () => {
      // Create posts from current user
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ caption: 'Feed post 1' });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ caption: 'Feed post 2' });

      // Create another user and their post
      const anotherUser = {
        username: 'feeduser',
        email: 'feed@example.com',
        password: 'password123',
      };
      
      const userResponse = await request(app)
        .post('/api/auth/signup')
        .send(anotherUser);
      
      const anotherToken = userResponse.body.data.token;

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ caption: 'Another user post' });
    });

    it('should get feed of all posts', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeInstanceOf(Array);
      expect(response.body.data.posts.length).toBe(3);
      
      // Check that posts have user info
      expect(response.body.data.posts[0]).toHaveProperty('user');
      expect(response.body.data.posts[0].user).toHaveProperty('username');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .query({ limit: 2, offset: 0 })
        .expect(200);

      expect(response.body.data.posts.length).toBe(2);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    it('should order posts by newest first', async () => {
      const response = await request(app)
        .get('/api/posts/feed')
        .expect(200);

      const posts = response.body.data.posts;
      
      // Check that posts are ordered by created_at DESC
      for (let i = 0; i < posts.length - 1; i++) {
        const current = new Date(posts[i].created_at);
        const next = new Date(posts[i + 1].created_at);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });
});