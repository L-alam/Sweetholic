import { Request, Response } from 'express';
import pool from '../config/database';

// GET USER PROFILE - Get a user's public profile by username
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // Fetch user profile with post count and follower/following counts
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.display_name,
        u.profile_photo_url,
        u.bio,
        u.created_at,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT f1.follower_id) as follower_count,
        COUNT(DISTINCT f2.following_id) as following_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN follows f1 ON u.id = f1.following_id
      LEFT JOIN follows f2 ON u.id = f2.follower_id
      WHERE u.username = $1
      GROUP BY u.id`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if the requesting user is following this profile (if authenticated)
    let isFollowing = false;
    if (req.user) {
      const followCheck = await pool.query(
        'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.user.id, result.rows[0].id]
      );
      isFollowing = followCheck.rows.length > 0;
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          profile_photo_url: user.profile_photo_url,
          bio: user.bio,
          created_at: user.created_at,
          post_count: parseInt(user.post_count),
          follower_count: parseInt(user.follower_count),
          following_count: parseInt(user.following_count),
          is_following: isFollowing,
        },
      },
    });
  } catch (error: any) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile',
      error: error.message,
    });
  }
};

// UPDATE USER PROFILE - Update current user's profile (protected)
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const { display_name, bio, profile_photo_url } = req.body;
    const userId = req.user.id;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount}`);
      values.push(display_name);
      paramCount++;
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }

    if (profile_photo_url !== undefined) {
      updates.push(`profile_photo_url = $${paramCount}`);
      values.push(profile_photo_url);
      paramCount++;
    }

    // If no fields to update
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add user ID as final parameter
    values.push(userId);

    // Execute update
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, display_name, profile_photo_url, bio, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile',
      error: error.message,
    });
  }
};

// DELETE USER ACCOUNT - Delete current user's account (protected)
export const deleteUserAccount = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userId = req.user.id;

    // Delete user (cascade will handle related records)
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
      data: {
        username: result.rows[0].username,
      },
    });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting account',
      error: error.message,
    });
  }
};

// SEARCH USERS - Search for users by username or display name
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Search query "q" is required',
      });
    }

    // Search users by username or display_name (case-insensitive)
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.display_name,
        u.profile_photo_url,
        u.bio,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT f.follower_id) as follower_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN follows f ON u.id = f.following_id
      WHERE 
        LOWER(u.username) LIKE LOWER($1) OR 
        LOWER(u.display_name) LIKE LOWER($1)
      GROUP BY u.id
      ORDER BY follower_count DESC, u.created_at DESC
      LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: {
        users: result.rows.map(user => ({
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          profile_photo_url: user.profile_photo_url,
          bio: user.bio,
          post_count: parseInt(user.post_count),
          follower_count: parseInt(user.follower_count),
        })),
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          count: result.rows.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error searching users',
      error: error.message,
    });
  }
};

// GET USER STATS - Get detailed stats for a user
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

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

    // Get comprehensive stats
    const statsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT p.id) as total_posts,
        COUNT(DISTINCT ph.id) as total_photos,
        COUNT(DISTINCT f1.follower_id) as follower_count,
        COUNT(DISTINCT f2.following_id) as following_count,
        COUNT(DISTINCT r.id) as total_reactions_received,
        COUNT(DISTINCT c.id) as total_comments_received
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN photos ph ON p.id = ph.post_id
      LEFT JOIN follows f1 ON u.id = f1.following_id
      LEFT JOIN follows f2 ON u.id = f2.follower_id
      LEFT JOIN reactions r ON p.id = r.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE u.id = $1
      GROUP BY u.id`,
      [userId]
    );

    const stats = statsResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_posts: parseInt(stats.total_posts),
          total_photos: parseInt(stats.total_photos),
          follower_count: parseInt(stats.follower_count),
          following_count: parseInt(stats.following_count),
          total_reactions_received: parseInt(stats.total_reactions_received),
          total_comments_received: parseInt(stats.total_comments_received),
        },
      },
    });
  } catch (error: any) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user stats',
      error: error.message,
    });
  }
};