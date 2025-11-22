import { Request, Response } from 'express';
import pool from '../config/database';

// CREATE POST
export const createPost = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { 
      caption, 
      location_name, 
      location_coordinates, 
      food_type, 
      rating_type, 
      is_public,
      photos, // Array of photo objects: [{ photo_url, photo_order, individual_description, individual_rating, is_front_camera }]
      food_items // NEW: Array of food items: [{ item_name, price, rating, item_order }]
    } = req.body;
    const userId = req.user.id;

    // Validate rating_type if provided
    const validRatingTypes = ['3_star', '5_star', '10_star'];
    if (rating_type && !validRatingTypes.includes(rating_type)) {
      return res.status(400).json({
        success: false,
        message: 'Rating type must be one of: 3_star, 5_star, 10_star',
      });
    }

    // Validate caption is provided
    if (!caption || caption.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Caption is required',
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Create post (removed price and rating from post-level)
    const postResult = await client.query(
      `INSERT INTO posts (
        user_id, caption, location_name, location_coordinates, 
        food_type, rating_type, is_public
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, caption, location_name, location_coordinates, 
                 food_type, rating_type, is_public, created_at, updated_at`,
      [
        userId, 
        caption.trim(), 
        location_name || null, 
        location_coordinates || null,
        food_type || null,
        rating_type || null,
        is_public !== undefined ? is_public : false
      ]
    );

    const post = postResult.rows[0];

    // Insert photos if provided
    let insertedPhotos: any[] = [];
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photo of photos) {
        // Validate rating based on rating_type if individual rating provided
        if (photo.individual_rating !== undefined && photo.individual_rating !== null && rating_type) {
          const maxRating = rating_type === '3_star' ? 3 : rating_type === '5_star' ? 5 : 10;
          if (photo.individual_rating < 1 || photo.individual_rating > maxRating) {
            throw new Error(`Individual rating must be between 1 and ${maxRating} for ${rating_type}`);
          }
        }

        const photoResult = await client.query(
          `INSERT INTO photos (
            post_id, photo_url, photo_order, individual_description, 
            individual_rating, is_front_camera
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, post_id, photo_url, photo_order, individual_description, 
                    individual_rating, is_front_camera, created_at`,
          [
            post.id,
            photo.photo_url,
            photo.photo_order !== undefined ? photo.photo_order : 0,
            photo.individual_description || null,
            photo.individual_rating || null,
            photo.is_front_camera !== undefined ? photo.is_front_camera : false
          ]
        );
        insertedPhotos.push(photoResult.rows[0]);
      }
    }

    // Insert food items if provided
    let insertedFoodItems: any[] = [];
    if (food_items && Array.isArray(food_items) && food_items.length > 0) {
      for (const item of food_items) {
        // Validate item rating based on post's rating_type
        if (item.rating !== undefined && item.rating !== null && rating_type) {
          const maxRating = rating_type === '3_star' ? 3 : rating_type === '5_star' ? 5 : 10;
          if (item.rating < 1 || item.rating > maxRating) {
            throw new Error(`Item rating must be between 1 and ${maxRating} for ${rating_type}`);
          }
        }

        const foodItemResult: any = await client.query(
          `INSERT INTO food_items (
            post_id, item_name, price, rating, item_order
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, post_id, item_name, price, rating, item_order, created_at`,
          [
            post.id,
            item.item_name || item.name, // Support both 'item_name' and 'name'
            item.price || null,
            item.rating || null,
            item.item_order !== undefined ? item.item_order : insertedFoodItems.length
          ]
        );
        insertedFoodItems.push(foodItemResult.rows[0]);
      }
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post: {
          ...post,
          photos: insertedPhotos,
          food_items: insertedFoodItems
        },
      },
    });
  } catch (error: any) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// GET SINGLE POST
export const getPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    // Get post with user info
    const result = await pool.query(
      `SELECT 
        p.id,
        p.user_id,
        p.caption,
        p.location_name,
        p.location_coordinates,
        p.food_type,
        p.rating_type,
        p.is_public,
        p.created_at,
        p.updated_at,
        u.username,
        u.display_name,
        u.profile_photo_url
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.id = $1`,
      [postId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const post = result.rows[0];

    // Get photos for this post
    const photosResult = await pool.query(
      `SELECT id, photo_url, photo_order, individual_description, 
              individual_rating, is_front_camera, created_at
       FROM photos 
       WHERE post_id = $1 
       ORDER BY photo_order`,
      [postId]
    );

    // Get food items for this post
    const foodItemsResult = await pool.query(
      `SELECT id, item_name, price, rating, item_order, created_at
       FROM food_items 
       WHERE post_id = $1 
       ORDER BY item_order`,
      [postId]
    );

    res.status(200).json({
      success: true,
      data: {
        post: {
          id: post.id,
          caption: post.caption,
          location_name: post.location_name,
          location_coordinates: post.location_coordinates,
          food_type: post.food_type,
          rating_type: post.rating_type,
          is_public: post.is_public,
          created_at: post.created_at,
          updated_at: post.updated_at,
          user: {
            id: post.user_id,
            username: post.username,
            display_name: post.display_name,
            profile_photo_url: post.profile_photo_url,
          },
          photos: photosResult.rows,
          food_items: foodItemsResult.rows,
        },
      },
    });
  } catch (error: any) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching post',
      error: error.message,
    });
  }
};

// UPDATE POST
export const updatePost = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { postId } = req.params;
    const { 
      caption, 
      location_name, 
      location_coordinates, 
      food_type,
      rating_type,
      is_public 
    } = req.body;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const postCheck = await client.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post',
      });
    }

    // Validate rating_type if provided
    const validRatingTypes = ['3_star', '5_star', '10_star'];
    if (rating_type && !validRatingTypes.includes(rating_type)) {
      return res.status(400).json({
        success: false,
        message: 'Rating type must be one of: 3_star, 5_star, 10_star',
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (caption !== undefined) {
      updates.push(`caption = $${paramCount}`);
      values.push(caption);
      paramCount++;
    }
    if (location_name !== undefined) {
      updates.push(`location_name = $${paramCount}`);
      values.push(location_name);
      paramCount++;
    }
    if (location_coordinates !== undefined) {
      updates.push(`location_coordinates = $${paramCount}`);
      values.push(location_coordinates);
      paramCount++;
    }
    if (food_type !== undefined) {
      updates.push(`food_type = $${paramCount}`);
      values.push(food_type);
      paramCount++;
    }
    if (rating_type !== undefined) {
      updates.push(`rating_type = $${paramCount}`);
      values.push(rating_type);
      paramCount++;
    }
    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount}`);
      values.push(is_public);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    values.push(postId);
    const result = await client.query(
      `UPDATE posts 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount}
       RETURNING id, user_id, caption, location_name, location_coordinates, 
                 food_type, rating_type, is_public, created_at, updated_at`,
      values
    );

    // Get photos and food items for response
    const photosResult = await client.query(
      `SELECT id, photo_url, photo_order, individual_description, 
              individual_rating, is_front_camera, created_at
       FROM photos 
       WHERE post_id = $1 
       ORDER BY photo_order`,
      [postId]
    );

    const foodItemsResult = await client.query(
      `SELECT id, item_name, price, rating, item_order, created_at
       FROM food_items 
       WHERE post_id = $1 
       ORDER BY item_order`,
      [postId]
    );

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: {
          ...result.rows[0],
          photos: photosResult.rows,
          food_items: foodItemsResult.rows
        },
      },
    });
  } catch (error: any) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating post',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// DELETE POST
export const deletePost = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { postId } = req.params;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const postCheck = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    // Delete post (cascade will handle photos, food_items, reactions, comments, etc.)
    await pool.query('DELETE FROM posts WHERE id = $1', [postId]);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting post',
      error: error.message,
    });
  }
};

// GET USER POSTS
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get user
    const userResult = await pool.query(
      'SELECT id, username, display_name, profile_photo_url FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // Get posts
    const postsResult = await pool.query(
      `SELECT 
        p.id,
        p.caption,
        p.location_name,
        p.location_coordinates,
        p.food_type,
        p.rating_type,
        p.is_public,
        p.created_at,
        p.updated_at
       FROM posts p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, limit, offset]
    );

    // Get photos and food items for each post
    const postsWithDetails = await Promise.all(
      postsResult.rows.map(async (post) => {
        const photosResult = await pool.query(
          `SELECT id, photo_url, photo_order, individual_description, 
                  individual_rating, is_front_camera, created_at
           FROM photos 
           WHERE post_id = $1 
           ORDER BY photo_order`,
          [post.id]
        );

        const foodItemsResult = await pool.query(
          `SELECT id, item_name, price, rating, item_order, created_at
           FROM food_items 
           WHERE post_id = $1 
           ORDER BY item_order`,
          [post.id]
        );

        return {
          ...post,
          user,
          photos: photosResult.rows,
          food_items: foodItemsResult.rows,
        };
      })
    );

    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM posts WHERE user_id = $1',
      [user.id]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithDetails,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user posts',
      error: error.message,
    });
  }
};

// GET FEED
export const getFeed = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get all public posts with user info
    const postsResult = await pool.query(
      `SELECT 
        p.id,
        p.user_id,
        p.caption,
        p.location_name,
        p.location_coordinates,
        p.food_type,
        p.rating_type,
        p.is_public,
        p.created_at,
        p.updated_at,
        u.username,
        u.display_name,
        u.profile_photo_url
       FROM posts p
       INNER JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get photos and food items for each post
    const postsWithDetails = await Promise.all(
      postsResult.rows.map(async (post) => {
        const photosResult = await pool.query(
          `SELECT id, photo_url, photo_order, individual_description, 
                  individual_rating, is_front_camera, created_at
           FROM photos 
           WHERE post_id = $1 
           ORDER BY photo_order`,
          [post.id]
        );

        const foodItemsResult = await pool.query(
          `SELECT id, item_name, price, rating, item_order, created_at
           FROM food_items 
           WHERE post_id = $1 
           ORDER BY item_order`,
          [post.id]
        );

        return {
          id: post.id,
          caption: post.caption,
          location_name: post.location_name,
          location_coordinates: post.location_coordinates,
          food_type: post.food_type,
          rating_type: post.rating_type,
          is_public: post.is_public,
          created_at: post.created_at,
          updated_at: post.updated_at,
          user: {
            id: post.user_id,
            username: post.username,
            display_name: post.display_name,
            profile_photo_url: post.profile_photo_url,
          },
          photos: photosResult.rows,
          food_items: foodItemsResult.rows,
        };
      })
    );

    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM posts');
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: {
        posts: postsWithDetails,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error: any) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching feed',
      error: error.message,
    });
  }
};