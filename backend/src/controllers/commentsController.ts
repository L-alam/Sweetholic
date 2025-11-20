import { Request, Response } from 'express';
import pool from '../config/database';

// POST CREATE COMMENT - Add a comment to a post
export const createComment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content must be 1000 characters or less',
      });
    }

    // Check if post exists
    const postResult = await client.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Create comment
    const result = await client.query(
      `INSERT INTO comments (post_id, user_id, content) 
       VALUES ($1, $2, $3) 
       RETURNING id, post_id, user_id, content, created_at, updated_at`,
      [postId, userId, content.trim()]
    );

    // Get user info for the response
    const userResult = await client.query(
      'SELECT username, display_name, profile_photo_url FROM users WHERE id = $1',
      [userId]
    );

    const comment = {
      ...result.rows[0],
      user: userResult.rows[0],
    };

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: {
        comment,
      },
    });
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating comment',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// PUT UPDATE COMMENT - Update a comment
export const updateComment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment content must be 1000 characters or less',
      });
    }

    // Check if comment exists and user owns it
    const commentResult = await client.query(
      'SELECT id, user_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (commentResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment',
      });
    }

    // Update comment
    const result = await client.query(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, post_id, user_id, content, created_at, updated_at`,
      [content.trim(), commentId]
    );

    // Get user info for the response
    const userResult = await client.query(
      'SELECT username, display_name, profile_photo_url FROM users WHERE id = $1',
      [userId]
    );

    const comment = {
      ...result.rows[0],
      user: userResult.rows[0],
    };

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: {
        comment,
      },
    });
  } catch (error: any) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating comment',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// DELETE COMMENT - Delete a comment
export const deleteComment = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;

    // Check if comment exists and user owns it
    const commentResult = await client.query(
      'SELECT id, user_id FROM comments WHERE id = $1',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (commentResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment',
      });
    }

    // Delete comment
    await client.query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting comment',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// GET POST COMMENTS - Get all comments for a post
export const getPostComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Check if post exists
    const postResult = await pool.query(
      'SELECT id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Get comments with user info
    const commentsResult = await pool.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name,
        u.profile_photo_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE post_id = $1',
      [postId]
    );

    // Format comments with nested user object
    const comments = commentsResult.rows.map(row => ({
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        username: row.username,
        display_name: row.display_name,
        profile_photo_url: row.profile_photo_url,
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          limit,
          offset,
          total: parseInt(countResult.rows[0].count),
        },
      },
    });
  } catch (error: any) {
    console.error('Get post comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching comments',
      error: error.message,
    });
  }
};

// GET USER COMMENTS - Get all comments by a user
export const getUserComments = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get user
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

    // Get comments
    const commentsResult = await pool.query(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name,
        u.profile_photo_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE user_id = $1',
      [userId]
    );

    // Format comments with nested user object
    const comments = commentsResult.rows.map(row => ({
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        username: row.username,
        display_name: row.display_name,
        profile_photo_url: row.profile_photo_url,
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          limit,
          offset,
          total: parseInt(countResult.rows[0].count),
        },
      },
    });
  } catch (error: any) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user comments',
      error: error.message,
    });
  }
};