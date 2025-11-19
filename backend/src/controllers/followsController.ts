import { Request, Response } from 'express';
import pool from '../config/database';

// POST FOLLOW USER - Follow a user
export const followUser = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { username } = req.params;
    const followerId = req.user!.id; // User doing the following

    // Get the user to follow
    const userResult = await client.query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const followingId = userResult.rows[0].id;

    // Check if user is trying to follow themselves
    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself',
      });
    }

    // Check if already following
    const existingFollow = await client.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (existingFollow.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already following this user',
      });
    }

    // Create follow relationship
    await client.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, followingId]
    );

    res.status(201).json({
      success: true,
      message: `Successfully followed ${username}`,
      data: {
        following: {
          username: userResult.rows[0].username,
        },
      },
    });
  } catch (error: any) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error following user',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// DELETE UNFOLLOW USER - Unfollow a user
export const unfollowUser = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { username } = req.params;
    const followerId = req.user!.id; // User doing the unfollowing

    // Get the user to unfollow
    const userResult = await client.query(
      'SELECT id, username FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const followingId = userResult.rows[0].id;

    // Check if user is trying to unfollow themselves
    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unfollow yourself',
      });
    }

    // Check if follow relationship exists
    const existingFollow = await client.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (existingFollow.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Not following this user',
      });
    }

    // Delete follow relationship
    await client.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    res.status(200).json({
      success: true,
      message: `Successfully unfollowed ${username}`,
      data: {
        unfollowed: {
          username: userResult.rows[0].username,
        },
      },
    });
  } catch (error: any) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error unfollowing user',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// GET FOLLOWERS - Get list of users following a specific user
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get the user
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

    // Get followers
    const followersResult = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.display_name,
        u.profile_photo_url,
        u.bio,
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM follows WHERE following_id = $1',
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        followers: followersResult.rows,
        pagination: {
          limit,
          offset,
          total: parseInt(countResult.rows[0].count),
        },
      },
    });
  } catch (error: any) {
    console.error('Get followers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching followers',
      error: error.message,
    });
  }
};

// GET FOLLOWING - Get list of users that a specific user is following
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get the user
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

    // Get following
    const followingResult = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.display_name,
        u.profile_photo_url,
        u.bio,
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = $1
      ORDER BY f.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM follows WHERE follower_id = $1',
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        following: followingResult.rows,
        pagination: {
          limit,
          offset,
          total: parseInt(countResult.rows[0].count),
        },
      },
    });
  } catch (error: any) {
    console.error('Get following error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching following',
      error: error.message,
    });
  }
};