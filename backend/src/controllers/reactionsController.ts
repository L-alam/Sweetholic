import { Request, Response } from 'express';
import pool from '../config/database';

// Valid reaction types
const VALID_REACTIONS = ['heart', 'thumbs_up', 'star_eyes', 'jealous', 'dislike'];

// POST ADD REACTION - Add a reaction to a post
export const addReaction = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { postId } = req.params;
    const { reaction_type } = req.body;
    const userId = req.user!.id;

    // Validate reaction type
    if (!reaction_type || !VALID_REACTIONS.includes(reaction_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reaction type. Must be one of: ${VALID_REACTIONS.join(', ')}`,
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

    // Check if user already reacted with this type
    const existingReaction = await client.query(
      'SELECT id FROM reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3',
      [postId, userId, reaction_type]
    );

    if (existingReaction.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already reacted with this type',
      });
    }

    // Add reaction
    const result = await client.query(
      `INSERT INTO reactions (post_id, user_id, reaction_type) 
       VALUES ($1, $2, $3) 
       RETURNING id, post_id, user_id, reaction_type, created_at`,
      [postId, userId, reaction_type]
    );

    res.status(201).json({
      success: true,
      message: 'Reaction added successfully',
      data: {
        reaction: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding reaction',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// DELETE REMOVE REACTION - Remove a reaction from a post
export const removeReaction = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { postId, reactionType } = req.params;
    const userId = req.user!.id;

    // Validate reaction type
    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reaction type. Must be one of: ${VALID_REACTIONS.join(', ')}`,
      });
    }

    // Check if reaction exists
    const existingReaction = await client.query(
      'SELECT id FROM reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3',
      [postId, userId, reactionType]
    );

    if (existingReaction.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reaction not found',
      });
    }

    // Delete reaction
    await client.query(
      'DELETE FROM reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3',
      [postId, userId, reactionType]
    );

    res.status(200).json({
      success: true,
      message: 'Reaction removed successfully',
    });
  } catch (error: any) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing reaction',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// GET POST REACTIONS - Get all reactions for a post
export const getPostReactions = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

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

    // Get reaction counts by type
    const countsResult = await pool.query(
      `SELECT 
        reaction_type,
        COUNT(*) as count
      FROM reactions
      WHERE post_id = $1
      GROUP BY reaction_type`,
      [postId]
    );

    // Get total count
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM reactions WHERE post_id = $1',
      [postId]
    );

    // Check if current user has reacted (if authenticated)
    let userReactions: string[] = [];
    if (req.user) {
      const userReactionsResult = await pool.query(
        'SELECT reaction_type FROM reactions WHERE post_id = $1 AND user_id = $2',
        [postId, req.user.id]
      );
      userReactions = userReactionsResult.rows.map(r => r.reaction_type);
    }

    // Format counts
    const reactionCounts: { [key: string]: number } = {};
    countsResult.rows.forEach(row => {
      reactionCounts[row.reaction_type] = parseInt(row.count);
    });

    res.status(200).json({
      success: true,
      data: {
        post_id: postId,
        total_reactions: parseInt(totalResult.rows[0].total),
        reaction_counts: reactionCounts,
        user_reactions: userReactions,
      },
    });
  } catch (error: any) {
    console.error('Get post reactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reactions',
      error: error.message,
    });
  }
};

// GET REACTION USERS - Get users who reacted to a post with a specific reaction type
export const getReactionUsers = async (req: Request, res: Response) => {
  try {
    const { postId, reactionType } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate reaction type
    if (!VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid reaction type. Must be one of: ${VALID_REACTIONS.join(', ')}`,
      });
    }

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

    // Get users who reacted
    const usersResult = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.display_name,
        u.profile_photo_url,
        r.created_at as reacted_at
      FROM reactions r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = $1 AND r.reaction_type = $2
      ORDER BY r.created_at DESC
      LIMIT $3 OFFSET $4`,
      [postId, reactionType, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM reactions WHERE post_id = $1 AND reaction_type = $2',
      [postId, reactionType]
    );

    res.status(200).json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          limit,
          offset,
          total: parseInt(countResult.rows[0].count),
        },
      },
    });
  } catch (error: any) {
    console.error('Get reaction users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reaction users',
      error: error.message,
    });
  }
};