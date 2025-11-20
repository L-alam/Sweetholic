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

describe('Lists API', () => {
  let authToken1: string;
  let authToken2: string;
  let postId1: string;
  let postId2: string;
  let postId3: string;

  // Setup: Create test users and posts
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

    // Create posts for user 1
    const post1 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ caption: 'Post 1', rating: 5 });
    postId1 = post1.body.data.post.id;

    const post2 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ caption: 'Post 2', rating: 4 });
    postId2 = post2.body.data.post.id;

    const post3 = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken1}`)
      .send({ caption: 'Post 3', rating: 3 });
    postId3 = post3.body.data.post.id;
  });

  describe('POST /api/lists - Create List', () => {
    it('should create a new list', async () => {
      const response = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          title: 'My Favorite Desserts',
          description: 'A collection of my all-time favorite sweets',
          is_public: true,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list.title).toBe('My Favorite Desserts');
      expect(response.body.data.list.description).toBe('A collection of my all-time favorite sweets');
      expect(response.body.data.list.is_public).toBe(true);
    });

    it('should create a private list', async () => {
      const response = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          title: 'Private List',
          is_public: false,
        })
        .expect(201);

      expect(response.body.data.list.is_public).toBe(false);
    });

    it('should default to public if is_public not specified', async () => {
      const response = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Default List' })
        .expect(201);

      expect(response.body.data.list.is_public).toBe(true);
    });

    it('should fail without title', async () => {
      const response = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ description: 'No title' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail with empty title', async () => {
      const response = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with title over 255 characters', async () => {
      const longTitle = 'a'.repeat(256);
      const response = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: longTitle })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/lists')
        .send({ title: 'My List' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/lists/:listId - Update List', () => {
    let listId: string;

    beforeEach(async () => {
      const listResponse = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Original Title' });
      listId = listResponse.body.data.list.id;
    });

    it('should update list title', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list.title).toBe('Updated Title');
    });

    it('should update multiple fields', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          title: 'New Title',
          description: 'New description',
          is_public: false,
        })
        .expect(200);

      expect(response.body.data.list.title).toBe('New Title');
      expect(response.body.data.list.description).toBe('New description');
      expect(response.body.data.list.is_public).toBe(false);
    });

    it('should fail when updating someone elses list', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ title: 'Hacked' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail with empty title', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-existent list', async () => {
      const response = await request(app)
        .put('/api/lists/99999')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}`)
        .send({ title: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/lists/:listId - Delete List', () => {
    let listId: string;

    beforeEach(async () => {
      const listResponse = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'List to Delete' });
      listId = listResponse.body.data.list.id;
    });

    it('should delete a list', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify list is deleted
      await request(app)
        .get(`/api/lists/${listId}`)
        .expect(404);
    });

    it('should fail when deleting someone elses list', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-existent list', async () => {
      const response = await request(app)
        .delete('/api/lists/99999')
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/lists/:listId/posts/:postId - Add Post to List', () => {
    let listId: string;

    beforeEach(async () => {
      const listResponse = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'My List' });
      listId = listResponse.body.data.list.id;
    });

    it('should add a post to a list', async () => {
      const response = await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list_item.list_id).toBe(listId);
      expect(response.body.data.list_item.post_id).toBe(postId1);
    });

    it('should add post with custom order', async () => {
      const response = await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ item_order: 5 })
        .expect(201);

      expect(response.body.data.list_item.item_order).toBe(5);
    });

    it('should auto-increment order if not specified', async () => {
      await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      const response = await request(app)
        .post(`/api/lists/${listId}/posts/${postId2}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      expect(response.body.data.list_item.item_order).toBeGreaterThan(0);
    });

    it('should fail when adding same post twice', async () => {
      await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(201);

      const response = await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already in');
    });

    it('should fail when adding someone elses post', async () => {
      // Create a post as user 2
      const user2Post = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ caption: 'User 2 post', rating: 5 });

      const response = await request(app)
        .post(`/api/lists/${listId}/posts/${user2Post.body.data.post.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('own posts');
    });

    it('should fail for non-existent list', async () => {
      const response = await request(app)
        .post(`/api/lists/99999/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail for non-existent post', async () => {
      const response = await request(app)
        .post(`/api/lists/${listId}/posts/99999`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/lists/:listId/posts/:postId - Remove Post from List', () => {
    let listId: string;

    beforeEach(async () => {
      const listResponse = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'My List' });
      listId = listResponse.body.data.list.id;

      await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`);
    });

    it('should remove a post from a list', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail when removing post not in list', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}/posts/${postId2}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail when modifying someone elses list', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/lists/${listId}/posts/${postId1}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/lists/:listId - Get List', () => {
    let listId: string;

    beforeEach(async () => {
      const listResponse = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'My List', description: 'Test list' });
      listId = listResponse.body.data.list.id;

      // Add posts to list
      await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ item_order: 0 });

      await request(app)
        .post(`/api/lists/${listId}/posts/${postId2}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ item_order: 1 });
    });

    it('should get a list with its posts', async () => {
      const response = await request(app)
        .get(`/api/lists/${listId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.list.title).toBe('My List');
      expect(response.body.data.list.item_count).toBe(2);
      expect(response.body.data.list.posts).toBeInstanceOf(Array);
      expect(response.body.data.list.posts.length).toBe(2);
    });

    it('should include user info', async () => {
      const response = await request(app)
        .get(`/api/lists/${listId}`)
        .expect(200);

      expect(response.body.data.list.user).toHaveProperty('username');
      expect(response.body.data.list.user.username).toBe(testUser1.username);
    });

    it('should order posts by item_order', async () => {
      const response = await request(app)
        .get(`/api/lists/${listId}`)
        .expect(200);

      const posts = response.body.data.list.posts;
      expect(posts[0].id).toBe(postId1);
      expect(posts[1].id).toBe(postId2);
    });

    it('should fail for private list when not authenticated', async () => {
      // Create private list
      const privateList = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Private', is_public: false });

      const response = await request(app)
        .get(`/api/lists/${privateList.body.data.list.id}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow owner to view private list', async () => {
      // Create private list
      const privateList = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Private', is_public: false });

      const response = await request(app)
        .get(`/api/lists/${privateList.body.data.list.id}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail for non-existent list', async () => {
      const response = await request(app)
        .get('/api/lists/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/lists/user/:username - Get User Lists', () => {
    beforeEach(async () => {
      // Create public and private lists
      await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Public List 1', is_public: true });

      await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Public List 2', is_public: true });

      await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'Private List', is_public: false });
    });

    it('should get all public lists for a user', async () => {
      const response = await request(app)
        .get(`/api/lists/user/${testUser1.username}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lists).toBeInstanceOf(Array);
      expect(response.body.data.lists.length).toBe(2); // Only public
    });

    it('should show all lists including private when owner views', async () => {
      const response = await request(app)
        .get(`/api/lists/user/${testUser1.username}`)
        .set('Authorization', `Bearer ${authToken1}`)
        .expect(200);

      expect(response.body.data.lists.length).toBe(3); // Public + private
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/lists/user/${testUser1.username}`)
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data.lists.length).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should fail for non-existent user', async () => {
      const response = await request(app)
        .get('/api/lists/user/nonexistentuser')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/lists/:listId/reorder - Reorder List Items', () => {
    let listId: string;

    beforeEach(async () => {
      const listResponse = await request(app)
        .post('/api/lists')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ title: 'My List' });
      listId = listResponse.body.data.list.id;

      // Add posts
      await request(app)
        .post(`/api/lists/${listId}/posts/${postId1}`)
        .set('Authorization', `Bearer ${authToken1}`);

      await request(app)
        .post(`/api/lists/${listId}/posts/${postId2}`)
        .set('Authorization', `Bearer ${authToken1}`);

      await request(app)
        .post(`/api/lists/${listId}/posts/${postId3}`)
        .set('Authorization', `Bearer ${authToken1}`);
    });

    it('should reorder list items', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}/reorder`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          item_orders: [
            { post_id: postId1, item_order: 2 },
            { post_id: postId2, item_order: 0 },
            { post_id: postId3, item_order: 1 },
          ],
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify order
      const listResponse = await request(app)
        .get(`/api/lists/${listId}`)
        .expect(200);

      const posts = listResponse.body.data.list.posts;
      expect(posts[0].id).toBe(postId2);
      expect(posts[1].id).toBe(postId3);
      expect(posts[2].id).toBe(postId1);
    });

    it('should fail with invalid item_orders format', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}/reorder`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({ item_orders: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when modifying someone elses list', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}/reorder`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          item_orders: [{ post_id: postId1, item_order: 0 }],
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/lists/${listId}/reorder`)
        .send({
          item_orders: [{ post_id: postId1, item_order: 0 }],
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});