import { Request, Response } from 'express';
import { ClassDiscussion } from '../models/ClassDiscussion';
import User from '../models/User';
import { generateAIResponse } from '../utils/aiHelper';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all discussions for a class with pagination, filtering, and sorting
 * GET /api/discussions/class/:classId
 */
export async function getClassDiscussions(req: Request, res: Response): Promise<void> {
  try {
    const { classId } = req.params;
    const {
      page = '1',
      limit = '10',
      subject,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = { classId: new mongoose.Types.ObjectId(classId) };
    
    if (subject) {
      filter.subject = subject;
    }

    // Build sort query - pinned discussions first, then by specified field
    const sortQuery: any = {};
    sortQuery.isPinned = -1; // Pinned first
    sortQuery[sortBy as string] = order === 'asc' ? 1 : -1;

    // Get discussions with pagination
    const discussions = await ClassDiscussion.find(filter)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'name email')
      .populate('replies.userId', 'name email')
      .lean();

    // Get total count for pagination
    const total = await ClassDiscussion.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        discussions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching class discussions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Create a new discussion
 * POST /api/discussions/create
 */
export async function createDiscussion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { classId, title, content, subject, chapter, topic } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Validate required fields
    if (!classId || !title || !content) {
      res.status(400).json({
        success: false,
        message: 'Class ID, title, and content are required',
      });
      return;
    }

    // Create new discussion
    const discussion = new ClassDiscussion({
      classId: new mongoose.Types.ObjectId(classId),
      userId: new mongoose.Types.ObjectId(userId),
      title,
      content,
      subject,
      chapter,
      topic,
      replies: [],
      likes: [],
      isPinned: false,
    });

    await discussion.save();

    // Populate user information
    await discussion.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Discussion created successfully',
      data: discussion,
    });
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create discussion',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Reply to a discussion
 * POST /api/discussions/:id/reply
 */
export async function replyToDiscussion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { content, requestAI = false } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    if (!content) {
      res.status(400).json({
        success: false,
        message: 'Reply content is required',
      });
      return;
    }

    // Find the discussion
    const discussion = await ClassDiscussion.findById(id);
    if (!discussion) {
      res.status(404).json({
        success: false,
        message: 'Discussion not found',
      });
      return;
    }

    // Add user reply
    const userReply = {
      userId: new mongoose.Types.ObjectId(userId),
      content,
      isAI: false,
      likes: [],
      createdAt: new Date(),
    };

    discussion.replies.push(userReply);
    await discussion.save();

    // Generate AI response if requested
    let aiReply = null;
    if (requestAI) {
      try {
        // Prepare previous replies for context
        await discussion.populate('replies.userId', 'name');
        const previousReplies = discussion.replies.map((reply: any) => ({
          userName: reply.userId?.name || 'Unknown',
          content: reply.content,
          isAI: reply.isAI,
        }));

        const aiContent = await generateAIResponse({
          userId: userId.toString(),
          discussionTitle: discussion.title,
          discussionContent: discussion.content,
          previousReplies,
          subject: discussion.subject,
          chapter: discussion.chapter,
          topic: discussion.topic,
        });

        // Add AI reply
        aiReply = {
          userId: new mongoose.Types.ObjectId(userId), // Use same user ID for tracking
          content: aiContent,
          isAI: true,
          likes: [],
          createdAt: new Date(),
        };

        discussion.replies.push(aiReply);
        await discussion.save();
      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
        // Continue without AI response - don't fail the entire request
      }
    }

    // Populate user information
    await discussion.populate('userId', 'name email');
    await discussion.populate('replies.userId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      data: {
        discussion,
        userReply,
        aiReply,
      },
    });
  } catch (error) {
    console.error('Error replying to discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Like a discussion or reply
 * POST /api/discussions/:id/like
 */
export async function likeMessage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { replyId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const discussion = await ClassDiscussion.findById(id);
    if (!discussion) {
      res.status(404).json({
        success: false,
        message: 'Discussion not found',
      });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Like a reply
    if (replyId) {
      const reply = discussion.replies.find(
        (r: any) => r._id?.toString() === replyId
      );
      
      if (!reply) {
        res.status(404).json({
          success: false,
          message: 'Reply not found',
        });
        return;
      }

      const likeIndex = reply.likes.findIndex(
        (like: any) => like.toString() === userObjectId.toString()
      );

      if (likeIndex > -1) {
        // Unlike
        reply.likes.splice(likeIndex, 1);
      } else {
        // Like
        reply.likes.push(userObjectId);
      }
    } else {
      // Like the main discussion
      const likeIndex = discussion.likes.findIndex(
        (like: any) => like.toString() === userObjectId.toString()
      );

      if (likeIndex > -1) {
        // Unlike
        discussion.likes.splice(likeIndex, 1);
      } else {
        // Like
        discussion.likes.push(userObjectId);
      }
    }

    await discussion.save();

    res.status(200).json({
      success: true,
      message: 'Like toggled successfully',
      data: discussion,
    });
  } catch (error) {
    console.error('Error liking message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Pin or unpin a discussion (admin only)
 * PUT /api/discussions/:id/pin
 */
export async function pinDiscussion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Only admins can pin discussions',
      });
      return;
    }

    const discussion = await ClassDiscussion.findById(id);
    if (!discussion) {
      res.status(404).json({
        success: false,
        message: 'Discussion not found',
      });
      return;
    }

    discussion.isPinned = isPinned !== undefined ? isPinned : !discussion.isPinned;
    await discussion.save();

    res.status(200).json({
      success: true,
      message: `Discussion ${discussion.isPinned ? 'pinned' : 'unpinned'} successfully`,
      data: discussion,
    });
  } catch (error) {
    console.error('Error pinning discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin discussion',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Delete a discussion
 * DELETE /api/discussions/:id
 */
export async function deleteDiscussion(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const discussion = await ClassDiscussion.findById(id);
    if (!discussion) {
      res.status(404).json({
        success: false,
        message: 'Discussion not found',
      });
      return;
    }

    // Check if user is the owner or an admin
    const user = await User.findById(userId);
    const isOwner = discussion.userId.toString() === userId.toString();
    const isAdmin = user?.role === 'admin';

    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'You can only delete your own discussions',
      });
      return;
    }

    await ClassDiscussion.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Discussion deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete discussion',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
