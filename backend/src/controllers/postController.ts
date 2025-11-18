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

    const { caption, location, rating } = req.body;
    const userId = req.user.id;

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Create post
    const result = await pool.query(
      `INSERT INTO posts (user_id, caption, location, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, caption, location, rating, created_at, updated_at`,
      [userId, caption || null, location || null, rating || null]
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

    // Get post with user info and photo count
    const result = await pool.query(
      `SELECT 
        p.id,
        p.user_id,
        p.caption,
        p.location,
        p.rating,
        p.created_at,
        p.updated_at,
        u.username,
        u.display_name,
        u.profile_photo_url,
        COUNT(DISTINCT ph.id) as photo_count,
        COUNT(DISTINCT r.id) as reaction_count,
        COUNT(DISTINCT c.id) as comment_count
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN photos ph ON p.id = ph.post_id
      LEFT JOIN reactions r ON p.id = r.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.id = $1
      GROUP BY p.id, u.id`,
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
      'SELECT id, photo_url, display_order FROM photos WHERE post_id = $1 ORDER BY display_order',
      [postId]
    );

    res.status(200).json({
      success: true,
      data: {
        post: {
          id: post.id,
          caption: post.caption,
          location: post.location,
          rating: post.rating,
          created_at: post.created_at,
          updated_at: post.updated_at,
          photo_count: parseInt(post.photo_count),
          reaction_count: parseInt(post.reaction_count),
          comment_count: parseInt(post.comment_count),
          user: {
            id: post.user_id,
            username: post.username,
            display_name: post.display_name,
            profile_photo_url: post.profile_photo_url,
          },
          photos: photosResult.rows,
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
    const { caption, location, rating } = req.body;
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

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
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

    if (location !== undefined) {
      updates.push(`location = $${paramCount}`);
      values.push(location);
      paramCount++;
    }

    if (rating !== undefined) {
      updates.push(`rating = $${paramCount}`);
      values.push(rating);
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
      RETURNING id, user_id, caption, location, rating, created_at, updated_at
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

    // Get posts with photos and counts
    const result = await pool.query(
      `SELECT 
        p.id,
        p.caption,
        p.location,
        p.rating,
        p.created_at,
        COUNT(DISTINCT ph.id) as photo_count,
        COUNT(DISTINCT r.id) as reaction_count,
        COUNT(DISTINCT c.id) as comment_count,
        json_agg(
          json_build_object(
            'id', ph.id,
            'photo_url', ph.photo_url,
            'display_order', ph.display_order
          ) ORDER BY ph.display_order
        ) FILTER (WHERE ph.id IS NOT NULL) as photos
      FROM posts p
      LEFT JOIN photos ph ON p.id = ph.post_id
      LEFT JOIN reactions r ON p.id = r.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        posts: result.rows.map(post => ({
          id: post.id,
          caption: post.caption,
          location: post.location,
          rating: post.rating,
          created_at: post.created_at,
          photo_count: parseInt(post.photo_count),
          reaction_count: parseInt(post.reaction_count),
          comment_count: parseInt(post.comment_count),
          photos: post.photos || [],
        })),
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

    // Get posts with user info and photos
    const result = await pool.query(
      `SELECT 
        p.id,
        p.caption,
        p.location,
        p.rating,
        p.created_at,
        u.id as user_id,
        u.username,
        u.display_name,
        u.profile_photo_url,
        COUNT(DISTINCT ph.id) as photo_count,
        COUNT(DISTINCT r.id) as reaction_count,
        COUNT(DISTINCT c.id) as comment_count,
        json_agg(
          json_build_object(
            'id', ph.id,
            'photo_url', ph.photo_url,
            'display_order', ph.display_order
          ) ORDER BY ph.display_order
        ) FILTER (WHERE ph.id IS NOT NULL) as photos
      FROM posts p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN photos ph ON p.id = ph.post_id
      LEFT JOIN reactions r ON p.id = r.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id, u.id
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
          location: post.location,
          rating: post.rating,
          created_at: post.created_at,
          photo_count: parseInt(post.photo_count),
          reaction_count: parseInt(post.reaction_count),
          comment_count: parseInt(post.comment_count),
          user: {
            id: post.user_id,
            username: post.username,
            display_name: post.display_name,
            profile_photo_url: post.profile_photo_url,
          },
          photos: post.photos || [],
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