import mongoose, { Document, Schema } from 'mongoose';

/**
 * Quiz Score interface
 */
export interface IQuizScore {
  _id: mongoose.Types.ObjectId;
  quizId: string;
  quizTitle: string;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent: number; // in seconds
  completedAt: Date;
  answers: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

/**
 * Achievement interface
 */
export interface IAchievement {
  _id: mongoose.Types.ObjectId;
  achievementId: string;
  title: string;
  description: string;
  category: 'learning' | 'social' | 'milestone' | 'special';
  icon: string;
  unlockedAt: Date;
  progress?: number;
  maxProgress?: number;
}

/**
 * Learning Streak interface
 */
export interface ILearningStreak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakStartDate: Date;
}

/**
 * Topic Progress interface
 */
export interface ITopicProgress {
  topic: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesTaken: number;
  averageScore: number;
  timeSpent: number; // in seconds
  lastAccessedAt: Date;
  status: 'not-started' | 'in-progress' | 'completed';
}

/**
 * Progress interface
 */
export interface IProgress extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Overall stats
  totalLessonsCompleted: number;
  totalQuizzesTaken: number;
  totalTimeSpent: number; // in seconds
  overallAverageScore: number;
  level: number;
  experiencePoints: number;
  
  // Quiz scores
  quizScores: IQuizScore[];
  
  // Achievements
  achievements: IAchievement[];
  achievementCount: number;
  
  // Learning streak
  learningStreak: ILearningStreak;
  
  // Topic-wise progress
  topicProgress: ITopicProgress[];
  
  // Activity tracking
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  addQuizScore(quizScore: Partial<IQuizScore>): Promise<this>;
  unlockAchievement(achievement: Partial<IAchievement>): Promise<this>;
  updateTopicProgress(topic: string, updates: Partial<ITopicProgress>): Promise<this>;
  completeLesson(topic: string, timeSpent?: number): Promise<this>;
}

/**
 * Quiz Score sub-schema
 */
const quizScoreSchema = new Schema<IQuizScore>(
  {
    quizId: {
      type: String,
      required: [true, 'Quiz ID is required'],
    },
    quizTitle: {
      type: String,
      required: [true, 'Quiz title is required'],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
    },
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: [true, 'Total questions is required'],
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    answers: [
      {
        questionId: {
          type: String,
          required: true,
        },
        question: {
          type: String,
          required: true,
        },
        userAnswer: {
          type: String,
          required: true,
        },
        correctAnswer: {
          type: String,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
  {
    _id: true,
  }
);

/**
 * Achievement sub-schema
 */
const achievementSchema = new Schema<IAchievement>(
  {
    achievementId: {
      type: String,
      required: [true, 'Achievement ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Achievement title is required'],
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required'],
    },
    category: {
      type: String,
      enum: ['learning', 'social', 'milestone', 'special'],
      required: [true, 'Achievement category is required'],
    },
    icon: {
      type: String,
      required: [true, 'Achievement icon is required'],
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
    },
    maxProgress: {
      type: Number,
      min: 1,
    },
  },
  {
    _id: true,
  }
);

/**
 * Topic Progress sub-schema
 */
const topicProgressSchema = new Schema<ITopicProgress>(
  {
    topic: {
      type: String,
      required: [true, 'Topic is required'],
    },
    lessonsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLessons: {
      type: Number,
      required: [true, 'Total lessons is required'],
      min: 1,
    },
    quizzesTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
  },
  {
    _id: false,
  }
);

/**
 * Progress schema definition
 */
const progressSchema = new Schema<IProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    totalLessonsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuizzesTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    overallAverageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    experiencePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    quizScores: {
      type: [quizScoreSchema],
      default: [],
    },
    achievements: {
      type: [achievementSchema],
      default: [],
    },
    achievementCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    learningStreak: {
      currentStreak: {
        type: Number,
        default: 0,
        min: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastActivityDate: {
        type: Date,
        default: Date.now,
      },
      streakStartDate: {
        type: Date,
        default: Date.now,
      },
    },
    topicProgress: {
      type: [topicProgressSchema],
      default: [],
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
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
progressSchema.index({ userId: 1 });
progressSchema.index({ level: -1 });
progressSchema.index({ experiencePoints: -1 });
progressSchema.index({ 'learningStreak.currentStreak': -1 });
progressSchema.index({ lastActivityAt: -1 });

/**
 * Virtual for user reference
 */
progressSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Virtual for completion percentage
 */
progressSchema.virtual('completionPercentage').get(function () {
  if (this.topicProgress.length === 0) return 0;
  
  const totalCompletion = this.topicProgress.reduce((sum, topic) => {
    return sum + (topic.lessonsCompleted / topic.totalLessons) * 100;
  }, 0);
  
  return Math.round(totalCompletion / this.topicProgress.length);
});

/**
 * Pre-save middleware to update counts and calculate stats
 */
progressSchema.pre('save', function () {
  // Update achievement count
  this.achievementCount = this.achievements.length;
  
  // Calculate overall average score
  if (this.quizScores.length > 0) {
    const totalScore = this.quizScores.reduce((sum, quiz) => sum + quiz.percentage, 0);
    this.overallAverageScore = Math.round(totalScore / this.quizScores.length);
  }
  
  // Update learning streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = new Date(this.learningStreak.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day, no change
  } else if (daysDiff === 1) {
    // Consecutive day, increment streak
    this.learningStreak.currentStreak += 1;
    this.learningStreak.lastActivityDate = new Date();
    
    if (this.learningStreak.currentStreak > this.learningStreak.longestStreak) {
      this.learningStreak.longestStreak = this.learningStreak.currentStreak;
    }
  } else if (daysDiff > 1) {
    // Streak broken, reset
    this.learningStreak.currentStreak = 1;
    this.learningStreak.streakStartDate = new Date();
    this.learningStreak.lastActivityDate = new Date();
  }
  
  // Calculate level based on experience points
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  this.level = Math.floor(Math.sqrt(this.experiencePoints / 100)) + 1;
});

/**
 * Static method to find progress by user ID
 */
progressSchema.statics.findByUserId = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId });
};

/**
 * Static method to create default progress for a user
 */
progressSchema.statics.createDefault = async function (userId: mongoose.Types.ObjectId) {
  const progress = new this({ userId });
  return await progress.save();
};

/**
 * Instance method to add quiz score
 */
progressSchema.methods.addQuizScore = function (quizScore: Partial<IQuizScore>) {
  this.quizScores.push({
    ...quizScore,
    _id: new mongoose.Types.ObjectId(),
  } as IQuizScore);
  
  this.totalQuizzesTaken += 1;
  this.totalTimeSpent += quizScore.timeSpent || 0;
  
  // Add experience points based on score
  const xpGained = Math.round((quizScore.percentage || 0) * 10);
  this.experiencePoints += xpGained;
  
  // Update topic progress
  const topicIndex = this.topicProgress.findIndex((t: ITopicProgress) => t.topic === quizScore.topic);
  if (topicIndex > -1) {
    const topic = this.topicProgress[topicIndex];
    topic.quizzesTaken += 1;
    
    // Recalculate average score for this topic
    const topicQuizzes = this.quizScores.filter((q: IQuizScore) => q.topic === quizScore.topic);
    const topicTotalScore = topicQuizzes.reduce((sum: number, q: IQuizScore) => sum + q.percentage, 0);
    topic.averageScore = Math.round(topicTotalScore / topicQuizzes.length);
    
    topic.lastAccessedAt = new Date();
  }
  
  this.lastActivityAt = new Date();
  return this.save();
};

/**
 * Instance method to unlock achievement
 */
progressSchema.methods.unlockAchievement = function (achievement: Partial<IAchievement>) {
  // Check if achievement already unlocked
  const exists = this.achievements.some((a: IAchievement) => a.achievementId === achievement.achievementId);
  if (exists) {
    return this;
  }
  
  this.achievements.push({
    ...achievement,
    unlockedAt: new Date(),
    _id: new mongoose.Types.ObjectId(),
  } as IAchievement);
  
  // Add bonus XP for unlocking achievement
  this.experiencePoints += 50;
  
  return this.save();
};

/**
 * Instance method to update topic progress
 */
progressSchema.methods.updateTopicProgress = function (
  topic: string,
  updates: Partial<ITopicProgress>
) {
  const topicIndex = this.topicProgress.findIndex((t: ITopicProgress) => t.topic === topic);
  
  if (topicIndex > -1) {
    // Update existing topic
    Object.assign(this.topicProgress[topicIndex], updates);
    this.topicProgress[topicIndex].lastAccessedAt = new Date();
    
    // Update status based on completion
    const topicData = this.topicProgress[topicIndex];
    if (topicData.lessonsCompleted >= topicData.totalLessons) {
      topicData.status = 'completed';
    } else if (topicData.lessonsCompleted > 0) {
      topicData.status = 'in-progress';
    }
  } else {
    // Add new topic
    this.topicProgress.push({
      topic,
      ...updates,
      lastAccessedAt: new Date(),
      status: 'in-progress',
    } as ITopicProgress);
  }
  
  this.lastActivityAt = new Date();
  return this.save();
};

/**
 * Instance method to complete a lesson
 */
progressSchema.methods.completeLesson = function (topic: string, timeSpent: number = 0) {
  const topicIndex = this.topicProgress.findIndex((t: ITopicProgress) => t.topic === topic);
  
  if (topicIndex > -1) {
    this.topicProgress[topicIndex].lessonsCompleted += 1;
    this.topicProgress[topicIndex].timeSpent += timeSpent;
    this.topicProgress[topicIndex].lastAccessedAt = new Date();
    
    // Update status
    const topicData = this.topicProgress[topicIndex];
    if (topicData.lessonsCompleted >= topicData.totalLessons) {
      topicData.status = 'completed';
    } else {
      topicData.status = 'in-progress';
    }
  }
  
  this.totalLessonsCompleted += 1;
  this.totalTimeSpent += timeSpent;
  this.experiencePoints += 25; // XP for completing a lesson
  this.lastActivityAt = new Date();
  
  return this.save();
};

/**
 * Create and export Progress model
 */
const Progress = mongoose.model<IProgress>('Progress', progressSchema);

export default Progress;
