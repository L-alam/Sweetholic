import { Request, Response } from 'express';
import pool from '../config/database';

// CREATE POST
export const createPost = async (req: Request, res: Response) => {
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
      price, 
      rating_type, 
      rating,
      is_public 
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

    // Validate rating based on rating_type
    if (rating !== undefined && rating_type) {
      const maxRating = rating_type === '3_star' ? 3 : rating_type === '5_star' ? 5 : 10;
      if (rating < 1 || rating > maxRating) {
        return res.status(400).json({
          success: false,
          message: `Rating must be between 1 and ${maxRating} for ${rating_type}`,
        });
      }
    }

    // Create post
    const result = await pool.query(
      `INSERT INTO posts (
        user_id, caption, location_name, location_coordinates, 
        food_type, price, rating_type, rating, is_public
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, caption, location_name, location_coordinates, 
                 food_type, price, rating_type, rating, is_public, created_at, updated_at`,
      [
        userId, 
        caption || null, 
        location_name || null, 
        location_coordinates || null,
        food_type || null,
        price || null,
        rating_type || null,
        rating || null,
        is_public !== undefined ? is_public : false
      ]
    );

    const post = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post,
      },
    });
  } catch (error: any) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post',
      error: error.message,
    });
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
        p.price,
        p.rating_type,
        p.rating,
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

    res.status(200).json({
      success: true,
      data: {
        post: {
          id: post.id,
          caption: post.caption,
          location_name: post.location_name,
          location_coordinates: post.location_coordinates,
          food_type: post.food_type,
          price: post.price,
          rating_type: post.rating_type,
          rating: post.rating,
          is_public: post.is_public,
          created_at: post.created_at,
          updated_at: post.updated_at,
          user: {
            id: post.user_id,
            username: post.username,
            display_name: post.display_name,
            profile_photo_url: post.profile_photo_url,
          },
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
      price, 
      rating_type, 
      rating,
      is_public 
    } = req.body;
    const userId = req.user.id;

    // Check if post exists and belongs to user
    const checkResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
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

    // Validate rating based on rating_type
    if (rating !== undefined && rating_type) {
      const maxRating = rating_type === '3_star' ? 3 : rating_type === '5_star' ? 5 : 10;
      if (rating < 1 || rating > maxRating) {
        return res.status(400).json({
          success: false,
          message: `Rating must be between 1 and ${maxRating} for ${rating_type}`,
        });
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
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

    if (price !== undefined) {
      updates.push(`price = $${paramCount}`);
      values.push(price);
      paramCount++;
    }

    if (rating_type !== undefined) {
      updates.push(`rating_type = $${paramCount}`);
      values.push(rating_type);
      paramCount++;
    }

    if (rating !== undefined) {
      updates.push(`rating = $${paramCount}`);
      values.push(rating);
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

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add post ID as final parameter
    values.push(postId);

    const query = `
      UPDATE posts 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, user_id, caption, location_name, location_coordinates, 
                food_type, price, rating_type, rating, is_public, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating post',
      error: error.message,
    });
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
    const checkResult = await pool.query(
      'SELECT user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post',
      });
    }

    // Delete post (cascade will handle photos, reactions, comments)
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

// GET USER POSTS - Get all posts by a specific user
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get user ID from username
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userId = userResult.rows[0].id;

    // Get posts
    const result = await pool.query(
      `SELECT 
        id,
        caption,
        location_name,
        location_coordinates,
        food_type,
        price,
        rating_type,
        rating,
        is_public,
        created_at
      FROM posts
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        posts: result.rows,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: result.rows.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts',
      error: error.message,
    });
  }
};

// GET FEED - Get posts from all users (could be enhanced with following filter later)
export const getFeed = async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Get posts with user info
    const result = await pool.query(
      `SELECT 
        p.id,
        p.caption,
        p.location_name,
        p.location_coordinates,
        p.food_type,
        p.price,
        p.rating_type,
        p.rating,
        p.is_public,
        p.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.profile_photo_url
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        posts: result.rows.map(post => ({
          id: post.id,
          caption: post.caption,
          location_name: post.location_name,
          location_coordinates: post.location_coordinates,
          food_type: post.food_type,
          price: post.price,
          rating_type: post.rating_type,
          rating: post.rating,
          is_public: post.is_public,
          created_at: post.created_at,
          user: {
            id: post.user_id,
            username: post.username,
            display_name: post.display_name,
            profile_photo_url: post.profile_photo_url,
          },
        })),
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: result.rows.length,
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