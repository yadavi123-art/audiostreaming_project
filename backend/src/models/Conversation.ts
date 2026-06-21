import mongoose, { Document, Schema } from 'mongoose';

/**
 * Message interface
 */
export interface IMessage {
  _id: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    temperature?: number;
    processingTime?: number;
  };
  attachments?: {
    type: 'image' | 'audio' | 'code' | 'file';
    url: string;
    name: string;
    size?: number;
  }[];
  feedback?: {
    rating: 1 | 2 | 3 | 4 | 5;
    comment?: string;
    timestamp: Date;
  };
}

/**
 * Conversation interface
 */
export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  context: {
    topic?: string;
    language?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    tags?: string[];
  };
  isActive: boolean;
  isPinned: boolean;
  lastMessageAt: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addMessage(message: Partial<IMessage>): Promise<this>;
  archive(): Promise<this>;
  togglePin(): Promise<this>;
}

/**
 * Message sub-schema
 */
const messageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: [true, 'Message role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [10000, 'Message content cannot exceed 10000 characters'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    metadata: {
      tokens: {
        type: Number,
        min: 0,
      },
      model: {
        type: String,
      },
      temperature: {
        type: Number,
        min: 0,
        max: 2,
      },
      processingTime: {
        type: Number,
        min: 0,
      },
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ['image', 'audio', 'code', 'file'],
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
    feedback: {
      rating: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
      },
      comment: {
        type: String,
        maxlength: [500, 'Feedback comment cannot exceed 500 characters'],
      },
      timestamp: {
        type: Date,
      },
    },
  },
  {
    _id: true,
  }
);

/**
 * Conversation schema definition
 */
const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Conversation title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    messages: {
      type: [messageSchema],
      default: [],
      validate: {
        validator: function (v: IMessage[]) {
          return v.length <= 1000;
        },
        message: 'Conversation cannot have more than 1000 messages',
      },
    },
    context: {
      topic: {
        type: String,
        trim: true,
      },
      language: {
        type: String,
        trim: true,
      },
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      tags: {
        type: [String],
        default: [],
        validate: {
          validator: function (v: string[]) {
            return v.length <= 20;
          },
          message: 'Cannot have more than 20 tags',
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
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
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isActive: 1 });
conversationSchema.index({ userId: 1, isPinned: -1, lastMessageAt: -1 });
conversationSchema.index({ 'context.tags': 1 });
conversationSchema.index({ 'context.topic': 1 });
conversationSchema.index({ lastMessageAt: -1 });

/**
 * Virtual for user reference
 */
conversationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Pre-save middleware to update message count and last message timestamp
 */
conversationSchema.pre('save', function () {
  if (this.isModified('messages')) {
    this.messageCount = this.messages.length;
    if (this.messages.length > 0) {
      const lastMessage = this.messages[this.messages.length - 1];
      this.lastMessageAt = lastMessage.timestamp;
    }
  }
});

/**
 * Static method to find conversations by user ID
 */
conversationSchema.statics.findByUserId = function (
  userId: mongoose.Types.ObjectId,
  options?: { active?: boolean; pinned?: boolean; limit?: number }
) {
  const query: any = { userId };
  
  if (options?.active !== undefined) {
    query.isActive = options.active;
  }
  
  if (options?.pinned !== undefined) {
    query.isPinned = options.pinned;
  }
  
  let queryBuilder = this.find(query).sort({ isPinned: -1, lastMessageAt: -1 });
  
  if (options?.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }
  
  return queryBuilder;
};

/**
 * Static method to search conversations
 */
conversationSchema.statics.searchConversations = function (
  userId: mongoose.Types.ObjectId,
  searchTerm: string,
  limit: number = 20
) {
  return this.find({
    userId,
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { 'context.topic': { $regex: searchTerm, $options: 'i' } },
      { 'context.tags': { $regex: searchTerm, $options: 'i' } },
    ],
  })
    .sort({ lastMessageAt: -1 })
    .limit(limit);
};

/**
 * Instance method to add a message
 */
conversationSchema.methods.addMessage = function (message: Partial<IMessage>) {
  this.messages.push({
    ...message,
    timestamp: message.timestamp || new Date(),
    _id: new mongoose.Types.ObjectId(),
  } as IMessage);
  return this.save();
};

/**
 * Instance method to archive conversation
 */
conversationSchema.methods.archive = function () {
  this.isActive = false;
  return this.save();
};

/**
 * Instance method to toggle pin status
 */
conversationSchema.methods.togglePin = function () {
  this.isPinned = !this.isPinned;
  return this.save();
};

/**
 * Create and export Conversation model
 */
const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);

export default Conversation;
