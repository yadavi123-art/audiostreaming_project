import express from 'express';
import {
  getClassDiscussions,
  createDiscussion,
  replyToDiscussion,
  likeMessage,
  pinDiscussion,
  deleteDiscussion,
} from '../controllers/discussionController';
import { protect } from '../middleware/auth';
import {
  validateCreateDiscussion,
  validateAddComment,
  validateDiscussionId,
  handleValidationErrors
} from '../middleware/validation';
import { discussionLimiter } from '../middleware/security';

const router = express.Router();

/**
 * Discussion Routes
 */

// GET /api/discussions/class/:classId - Get all discussions for a class
// Query params: page, limit, subject, sortBy, order
router.get('/class/:classId', protect, getClassDiscussions);

// POST /api/discussions/create - Create a new discussion
// Body: { classId, title, content, subject?, chapter?, topic? }
router.post('/create', protect, discussionLimiter, validateCreateDiscussion, handleValidationErrors, createDiscussion);

// POST /api/discussions/:id/reply - Reply to a discussion
// Body: { content, requestAI? }
router.post('/:id/reply', protect, validateAddComment, handleValidationErrors, replyToDiscussion);

// POST /api/discussions/:id/like - Like a discussion or reply
// Body: { replyId? }
router.post('/:id/like', protect, likeMessage);

// PUT /api/discussions/:id/pin - Pin or unpin a discussion (admin only)
// Body: { isPinned }
router.put('/:id/pin', protect, pinDiscussion);

// DELETE /api/discussions/:id - Delete a discussion
router.delete('/:id', protect, deleteDiscussion);

export default router;
