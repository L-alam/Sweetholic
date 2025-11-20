import { Request, Response } from 'express';
import pool from '../config/database';

// POST CREATE LIST - Create a new list
export const createList = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { title, description, cover_photo_url, is_public } = req.body;
    const userId = req.user!.id;

    // Validate title
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'List title is required',
      });
    }

    if (title.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'List title must be 255 characters or less',
      });
    }

    // Create list
    const result = await client.query(
      `INSERT INTO lists (user_id, title, description, cover_photo_url, is_public) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, user_id, title, description, cover_photo_url, is_public, created_at, updated_at`,
      [userId, title.trim(), description || null, cover_photo_url || null, is_public !== undefined ? is_public : true]
    );

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: {
        list: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error('Create list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating list',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// PUT UPDATE LIST - Update a list's details
export const updateList = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { listId } = req.params;
    const { title, description, cover_photo_url, is_public } = req.body;
    const userId = req.user!.id;

    // Check if list exists and user owns it
    const listResult = await client.query(
      'SELECT id, user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    if (listResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this list',
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'List title cannot be empty',
        });
      }
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (cover_photo_url !== undefined) {
      updates.push(`cover_photo_url = $${paramCount++}`);
      values.push(cover_photo_url);
    }

    if (is_public !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(is_public);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(listId);

    // Update list
    const result = await client.query(
      `UPDATE lists 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, user_id, title, description, cover_photo_url, is_public, created_at, updated_at`,
      values
    );

    res.status(200).json({
      success: true,
      message: 'List updated successfully',
      data: {
        list: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error('Update list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating list',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// DELETE LIST - Delete a list
export const deleteList = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { listId } = req.params;
    const userId = req.user!.id;

    // Check if list exists and user owns it
    const listResult = await client.query(
      'SELECT id, user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    if (listResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this list',
      });
    }

    // Delete list (cascade will delete list_items)
    await client.query('DELETE FROM lists WHERE id = $1', [listId]);

    res.status(200).json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting list',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// GET LIST - Get a single list with its posts
export const getList = async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;

    // Get list details
    const listResult = await pool.query(
      `SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.cover_photo_url,
        l.is_public,
        l.created_at,
        l.updated_at,
        u.username,
        u.display_name,
        u.profile_photo_url,
        COUNT(DISTINCT li.id) as item_count
      FROM lists l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN list_items li ON l.id = li.list_id
      WHERE l.id = $1
      GROUP BY l.id, u.username, u.display_name, u.profile_photo_url`,
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    const list = listResult.rows[0];

    // Check if list is private and user doesn't own it
    if (!list.is_public && (!req.user || req.user.id !== list.user_id)) {
      return res.status(403).json({
        success: false,
        message: 'This list is private',
      });
    }

    // Get posts in the list
    const postsResult = await pool.query(
      `SELECT 
        p.id,
        p.user_id,
        p.caption,
        p.location_name,
        p.food_type,
        p.price,
        p.rating,
        p.created_at,
        li.item_order,
        li.added_at,
        json_agg(
          json_build_object(
            'id', ph.id,
            'photo_url', ph.photo_url,
            'photo_order', ph.photo_order
          ) ORDER BY ph.photo_order
        ) FILTER (WHERE ph.id IS NOT NULL) as photos
      FROM list_items li
      JOIN posts p ON li.post_id = p.id
      LEFT JOIN photos ph ON p.id = ph.post_id
      WHERE li.list_id = $1
      GROUP BY p.id, li.item_order, li.added_at
      ORDER BY li.item_order ASC`,
      [listId]
    );

    const listData = {
      id: list.id,
      user_id: list.user_id,
      title: list.title,
      description: list.description,
      cover_photo_url: list.cover_photo_url,
      is_public: list.is_public,
      created_at: list.created_at,
      updated_at: list.updated_at,
      item_count: parseInt(list.item_count),
      user: {
        username: list.username,
        display_name: list.display_name,
        profile_photo_url: list.profile_photo_url,
      },
      posts: postsResult.rows,
    };

    res.status(200).json({
      success: true,
      data: {
        list: listData,
      },
    });
  } catch (error: any) {
    console.error('Get list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching list',
      error: error.message,
    });
  }
};

// GET USER LISTS - Get all lists created by a user
export const getUserLists = async (req: Request, res: Response) => {
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

    // If viewing someone else's lists, only show public ones
    let publicFilter = '';
    if (!req.user || req.user.id !== userId) {
      publicFilter = 'AND l.is_public = true';
    }

    // Get lists
    const listsResult = await pool.query(
      `SELECT 
        l.id,
        l.user_id,
        l.title,
        l.description,
        l.cover_photo_url,
        l.is_public,
        l.created_at,
        l.updated_at,
        COUNT(DISTINCT li.id) as item_count
      FROM lists l
      LEFT JOIN list_items li ON l.id = li.list_id
      WHERE l.user_id = $1 ${publicFilter}
      GROUP BY l.id
      ORDER BY l.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM lists WHERE user_id = $1 ${publicFilter}`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        lists: listsResult.rows.map(list => ({
          ...list,
          item_count: parseInt(list.item_count),
        })),
        pagination: {
          limit,
          offset,
          total: parseInt(countResult.rows[0].count),
        },
      },
    });
  } catch (error: any) {
    console.error('Get user lists error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user lists',
      error: error.message,
    });
  }
};

// POST ADD POST TO LIST - Add a post to a list
export const addPostToList = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { listId, postId } = req.params;
    const { item_order } = req.body;
    const userId = req.user!.id;

    // Check if list exists and user owns it
    const listResult = await client.query(
      'SELECT id, user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    if (listResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this list',
      });
    }

    // Check if post exists and user owns it
    const postResult = await client.query(
      'SELECT id, user_id FROM posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    if (postResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Can only add your own posts to lists',
      });
    }

    // Check if post is already in the list
    const existingItem = await client.query(
      'SELECT id FROM list_items WHERE list_id = $1 AND post_id = $2',
      [listId, postId]
    );

    if (existingItem.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Post is already in this list',
      });
    }

    // If no order specified, add to end
    let order = item_order;
    if (order === undefined) {
      const maxOrderResult = await client.query(
        'SELECT COALESCE(MAX(item_order), -1) + 1 as next_order FROM list_items WHERE list_id = $1',
        [listId]
      );
      order = maxOrderResult.rows[0].next_order;
    }

    // Add post to list
    const result = await client.query(
      `INSERT INTO list_items (list_id, post_id, item_order) 
       VALUES ($1, $2, $3) 
       RETURNING id, list_id, post_id, item_order, added_at`,
      [listId, postId, order]
    );

    res.status(201).json({
      success: true,
      message: 'Post added to list successfully',
      data: {
        list_item: result.rows[0],
      },
    });
  } catch (error: any) {
    console.error('Add post to list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding post to list',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// DELETE REMOVE POST FROM LIST - Remove a post from a list
export const removePostFromList = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { listId, postId } = req.params;
    const userId = req.user!.id;

    // Check if list exists and user owns it
    const listResult = await client.query(
      'SELECT id, user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    if (listResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this list',
      });
    }

    // Check if post is in the list
    const listItemResult = await client.query(
      'SELECT id FROM list_items WHERE list_id = $1 AND post_id = $2',
      [listId, postId]
    );

    if (listItemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found in this list',
      });
    }

    // Remove post from list
    await client.query(
      'DELETE FROM list_items WHERE list_id = $1 AND post_id = $2',
      [listId, postId]
    );

    res.status(200).json({
      success: true,
      message: 'Post removed from list successfully',
    });
  } catch (error: any) {
    console.error('Remove post from list error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing post from list',
      error: error.message,
    });
  } finally {
    client.release();
  }
};

// PUT REORDER LIST ITEMS - Update the order of posts in a list
export const reorderListItems = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { listId } = req.params;
    const { item_orders } = req.body; // Array of { post_id, item_order }
    const userId = req.user!.id;

    // Validate input
    if (!Array.isArray(item_orders) || item_orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'item_orders must be a non-empty array of { post_id, item_order }',
      });
    }

    // Check if list exists and user owns it
    const listResult = await client.query(
      'SELECT id, user_id FROM lists WHERE id = $1',
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    if (listResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this list',
      });
    }

    // Begin transaction
    await client.query('BEGIN');

    // Update each item's order
    for (const item of item_orders) {
      await client.query(
        'UPDATE list_items SET item_order = $1 WHERE list_id = $2 AND post_id = $3',
        [item.item_order, listId, item.post_id]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'List items reordered successfully',
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Reorder list items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reordering list items',
      error: error.message,
    });
  } finally {
    client.release();
  }
};