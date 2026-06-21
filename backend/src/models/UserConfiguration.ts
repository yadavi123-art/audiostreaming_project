import mongoose, { Document, Schema } from 'mongoose';

/**
 * AI Personality Settings interface
 */
export interface IAIPersonality {
  tone: 'friendly' | 'professional' | 'casual' | 'formal';
  verbosity: 'concise' | 'moderate' | 'detailed';
  teachingStyle: 'visual' | 'textual' | 'interactive' | 'mixed';
  encouragementLevel: 'minimal' | 'moderate' | 'high';
  humorLevel: 'none' | 'light' | 'moderate';
}

/**
 * Learning Preferences interface
 */
export interface ILearningPreferences {
  preferredLanguages: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningPace: 'slow' | 'moderate' | 'fast';
  focusAreas: string[];
  notificationPreferences: {
    email: boolean;
    push: boolean;
    dailyReminders: boolean;
    weeklyProgress: boolean;
  };
  studySchedule: {
    preferredDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
    preferredTimeSlots: ('morning' | 'afternoon' | 'evening' | 'night')[];
  };
}

/**
 * Accessibility Settings interface
 */
export interface IAccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
}

/**
 * UserConfiguration interface
 */
export interface IUserConfiguration extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  aiPersonality: IAIPersonality;
  learningPreferences: ILearningPreferences;
  accessibilitySettings: IAccessibilitySettings;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UserConfiguration schema definition
 */
const userConfigurationSchema = new Schema<IUserConfiguration>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    aiPersonality: {
      tone: {
        type: String,
        enum: ['friendly', 'professional', 'casual', 'formal'],
        default: 'friendly',
      },
      verbosity: {
        type: String,
        enum: ['concise', 'moderate', 'detailed'],
        default: 'moderate',
      },
      teachingStyle: {
        type: String,
        enum: ['visual', 'textual', 'interactive', 'mixed'],
        default: 'mixed',
      },
      encouragementLevel: {
        type: String,
        enum: ['minimal', 'moderate', 'high'],
        default: 'moderate',
      },
      humorLevel: {
        type: String,
        enum: ['none', 'light', 'moderate'],
        default: 'light',
      },
    },
    learningPreferences: {
      preferredLanguages: {
        type: [String],
        default: ['JavaScript'],
        validate: {
          validator: function (v: string[]) {
            return v.length > 0;
          },
          message: 'At least one preferred language is required',
        },
      },
      difficultyLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
      },
      learningPace: {
        type: String,
        enum: ['slow', 'moderate', 'fast'],
        default: 'moderate',
      },
      focusAreas: {
        type: [String],
        default: [],
      },
      notificationPreferences: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        dailyReminders: {
          type: Boolean,
          default: false,
        },
        weeklyProgress: {
          type: Boolean,
          default: true,
        },
      },
      studySchedule: {
        preferredDays: {
          type: [String],
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        },
        preferredTimeSlots: {
          type: [String],
          enum: ['morning', 'afternoon', 'evening', 'night'],
          default: ['evening'],
        },
      },
    },
    accessibilitySettings: {
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large', 'extra-large'],
        default: 'medium',
      },
      highContrast: {
        type: Boolean,
        default: false,
      },
      screenReader: {
        type: Boolean,
        default: false,
      },
      keyboardNavigation: {
        type: Boolean,
        default: false,
      },
      reducedMotion: {
        type: Boolean,
        default: false,
      },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto',
    },
    language: {
      type: String,
      default: 'en',
      match: [/^[a-z]{2}(-[A-Z]{2})?$/, 'Please provide a valid language code'],
    },
    timezone: {
      type: String,
      default: 'UTC',
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
userConfigurationSchema.index({ userId: 1 });
userConfigurationSchema.index({ 'learningPreferences.difficultyLevel': 1 });
userConfigurationSchema.index({ 'learningPreferences.preferredLanguages': 1 });

/**
 * Virtual for user reference
 */
userConfigurationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

/**
 * Static method to find configuration by user ID
 */
userConfigurationSchema.statics.findByUserId = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ userId });
};

/**
 * Static method to create default configuration for a user
 */
userConfigurationSchema.statics.createDefault = async function (userId: mongoose.Types.ObjectId) {
  const config = new this({ userId });
  return await config.save();
};

/**
 * Create and export UserConfiguration model
 */
const UserConfiguration = mongoose.model<IUserConfiguration>(
  'UserConfiguration',
  userConfigurationSchema
);

export default UserConfiguration;
