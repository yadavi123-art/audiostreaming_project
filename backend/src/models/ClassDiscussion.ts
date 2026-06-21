import mongoose, { Document, Schema } from 'mongoose';

/**
 * Simple Discussion Reply interface for class discussions
 */
interface IDiscussionReply {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  isAI: boolean;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
}

/**
 * Simple Class Discussion interface
 */
interface IClassDiscussion extends Document {
  classId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  replies: IDiscussionReply[];
  likes: mongoose.Types.ObjectId[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Simple Discussion Reply Schema
const discussionReplySchema = new Schema<IDiscussionReply>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  isAI: {
    type: Boolean,
    default: false,
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Simple Class Discussion Schema
const classDiscussionSchema = new Schema<IClassDiscussion>(
  {
    classId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      index: true,
    },
    chapter: {
      type: String,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    replies: [discussionReplySchema],
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create model
const ClassDiscussion = mongoose.model<IClassDiscussion>('ClassDiscussion', classDiscussionSchema);

export { ClassDiscussion, IClassDiscussion, IDiscussionReply };
