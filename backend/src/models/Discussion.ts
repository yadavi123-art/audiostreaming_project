import mongoose, { Document, Schema } from 'mongoose';

/**
 * Reply interface
 */
export interface IReply {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  isEdited: boolean;
  editedAt?: Date;
}

/**
 * Discussion Message interface
 */
export interface IDiscussionMessage {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  likes: mongoose.Types.ObjectId[];
  likeCount: number;
  replies: IReply[];
  replyCount: number;
  isEdited: boolean;
  editedAt?: Date;
  isPinned: boolean;
  attachments?: {
    type: 'image' | 'code' | 'file' | 'link';
    url: string;
    name: string;
    size?: number;
  }[];
}

/**
 * Discussion interface
 */
export interface IDiscussion extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'general' | 'question' | 'showcase' | 'help' | 'announcement';
  tags: string[];
  authorId: mongoose.Types.ObjectId;
  messages: IDiscussionMessage[];
  participants: mongoose.Types.ObjectId[];
  participantCount: number;
  messageCount: number;
  isLocked: boolean;
  isPinned: boolean;
  isFeatured: boolean;
  views: number;
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addMessage(userId: mongoose.Types.ObjectId, content: string, attachments?: IDiscussionMessage['attachments']): Promise<this>;
  addReply(messageId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId, content: string): Promise<this>;
  toggleMessageLike(messageId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<this>;
  toggleReplyLike(messageId: mongoose.Types.ObjectId, replyId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<this>;
  incrementViews(): Promise<this>;
}

/**
 * Reply sub-schema
 */
const replySchema = new Schema<IReply>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      minlength: [1, 'Reply content cannot be empty'],
      maxlength: [2000, 'Reply content cannot exceed 2000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  {
    _id: true,
  }
);

/**
 * Discussion Message sub-schema
 */
const discussionMessageSchema = new Schema<IDiscussionMessage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message content cannot be empty'],
      maxlength: [5000, 'Message content cannot exceed 5000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    replies: {
      type: [replySchema],
      default: [],
      validate: {
        validator: function (v: IReply[]) {
          return v.length <= 100;
        },
        message: 'Message cannot have more than 100 replies',
      },
    },
    replyCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'code', 'file', 'link'],
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
    ],
  },
  {
    _id: true,
  }
);

/**
 * Discussion schema definition
 */
const discussionSchema = new Schema<IDiscussion>(
  {
    title: {
      type: String,
      required: [true, 'Discussion title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters long'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Discussion description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters long'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      enum: ['general', 'question', 'showcase', 'help', 'announcement'],
      required: [true, 'Category is required'],
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true,
    },
    messages: {
      type: [discussionMessageSchema],
      default: [],
      validate: {
        validator: function (v: IDiscussionMessage[]) {
          return v.length <= 500;
        },
        message: 'Discussion cannot have more than 500 messages',
      },
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

/**
 * Indexes for performance
 */
discussionSchema.index({ authorId: 1, createdAt: -1 });
discussionSchema.index({ category: 1, isPinned: -1, lastActivityAt: -1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ isFeatured: -1, views: -1 });
discussionSchema.index({ lastActivityAt: -1 });
discussionSchema.index({ title: 'text', description: 'text' });

/**
 * Virtual for author reference
 */
discussionSchema.virtual('author', {
  ref: 'User',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Pre-save middleware to update counts and last activity
 */
discussionSchema.pre('save', function () {
  if (this.isModified('messages')) {
    this.messageCount = this.messages.length;
    
    // Update reply counts for each message
    this.messages.forEach((message) => {
      message.replyCount = message.replies.length;
    });
    
    // Update participants list
    const participantSet = new Set<string>();
    participantSet.add(this.authorId.toString());
    
    this.messages.forEach((message) => {
      participantSet.add(message.userId.toString());
      message.replies.forEach((reply) => {
        participantSet.add(reply.userId.toString());
      });
    });
    
    this.participants = Array.from(participantSet).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    this.participantCount = this.participants.length;
    
    // Update last activity timestamp
    if (this.messages.length > 0) {
      const lastMessage = this.messages[this.messages.length - 1];
      this.lastActivityAt = lastMessage.timestamp;
    }
  }
});

/**
 * Static method to find discussions by category
 */
discussionSchema.statics.findByCategory = function (
  category: string,
  options?: { limit?: number; skip?: number }
) {
  return this.find({ category: category as any })
    .sort({ isPinned: -1, lastActivityAt: -1 })
    .limit(options?.limit || 20)
    .skip(options?.skip || 0);
};

/**
 * Static method to search discussions
 */
discussionSchema.statics.searchDiscussions = function (
  searchTerm: string,
  options?: { category?: string; limit?: number }
) {
  const query: any = {
    $text: { $search: searchTerm },
  };
  
  if (options?.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .sort({ score: { $meta: 'textScore' } })
    .limit(options?.limit || 20);
};

/**
 * Instance method to add a message
 */
discussionSchema.methods.addMessage = function (
  userId: mongoose.Types.ObjectId,
  content: string,
  attachments?: IDiscussionMessage['attachments']
) {
  if (this.isLocked) {
    throw new Error('Cannot add message to locked discussion');
  }
  
  this.messages.push({
    userId,
    content,
    attachments,
    timestamp: new Date(),
    likes: [],
    likeCount: 0,
    replies: [],
    replyCount: 0,
    isEdited: false,
    isPinned: false,
    _id: new mongoose.Types.ObjectId(),
  } as IDiscussionMessage);
  
  return this.save();
};

/**
 * Instance method to add a reply to a message
 */
discussionSchema.methods.addReply = function (
  messageId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  content: string
) {
  if (this.isLocked) {
    throw new Error('Cannot add reply to locked discussion');
  }
  
  const message = this.messages.id(messageId);
  if (!message) {
    throw new Error('Message not found');
  }
  
  message.replies.push({
    userId,
    content,
    timestamp: new Date(),
    likes: [],
    likeCount: 0,
    isEdited: false,
    _id: new mongoose.Types.ObjectId(),
  } as IReply);
  
  return this.save();
};

/**
 * Instance method to toggle like on a message
 */
discussionSchema.methods.toggleMessageLike = function (
  messageId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  const message = this.messages.id(messageId);
  if (!message) {
    throw new Error('Message not found');
  }
  
  const likeIndex = message.likes.findIndex((id: mongoose.Types.ObjectId) => id.equals(userId));
  
  if (likeIndex > -1) {
    message.likes.splice(likeIndex, 1);
  } else {
    message.likes.push(userId);
  }
  
  message.likeCount = message.likes.length;
  return this.save();
};

/**
 * Instance method to toggle like on a reply
 */
discussionSchema.methods.toggleReplyLike = function (
  messageId: mongoose.Types.ObjectId,
  replyId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) {
  const message = this.messages.id(messageId);
  if (!message) {
    throw new Error('Message not found');
  }
  
  const reply = message.replies.id(replyId);
  if (!reply) {
    throw new Error('Reply not found');
  }
  
  const likeIndex = reply.likes.findIndex((id: mongoose.Types.ObjectId) => id.equals(userId));
  
  if (likeIndex > -1) {
    reply.likes.splice(likeIndex, 1);
  } else {
    reply.likes.push(userId);
  }
  
  reply.likeCount = reply.likes.length;
  return this.save();
};

/**
 * Instance method to increment view count
 */
discussionSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

/**
 * Create and export Discussion model
 */
const Discussion = mongoose.model<IDiscussion>('Discussion', discussionSchema);

export default Discussion;
