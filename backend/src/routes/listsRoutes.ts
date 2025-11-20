import { Router } from 'express';
import {
  createList,
  updateList,
  deleteList,
  getList,
  getUserLists,
  addPostToList,
  removePostFromList,
  reorderListItems,
} from '../controllers/listsController';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// POST create a new list (requires auth)
router.post('/', authenticate, createList);

// PUT update a list (requires auth)
router.put('/:listId', authenticate, updateList);

// DELETE a list (requires auth)
router.delete('/:listId', authenticate, deleteList);

// GET a single list with posts (optional auth for private lists)
router.get('/:listId', optionalAuthenticate, getList);

// GET all lists by a user (optional auth to see private lists)
router.get('/user/:username', optionalAuthenticate, getUserLists);

// POST add a post to a list (requires auth)
router.post('/:listId/posts/:postId', authenticate, addPostToList);

// DELETE remove a post from a list (requires auth)
router.delete('/:listId/posts/:postId', authenticate, removePostFromList);

// PUT reorder posts in a list (requires auth)
router.put('/:listId/reorder', authenticate, reorderListItems);

export default router;