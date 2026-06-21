/**
 * Demo Data Seeding Script
 * Creates sample users, discussions, conversations, and progress data for demo purposes
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../src/models/User';
import UserConfiguration from '../src/models/UserConfiguration';
import { ClassDiscussion } from '../src/models/ClassDiscussion';
import Conversation from '../src/models/Conversation';
import Progress from '../src/models/Progress';
import dotenv from 'dotenv';

dotenv.config();

// Demo users data
const demoUsers = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.demo@example.com',
    password: 'demo123',
    class: '10',
    setupComplete: true
  },
  {
    name: 'Priya Patel',
    email: 'priya.demo@example.com',
    password: 'demo123',
    class: '9',
    setupComplete: true
  },
  {
    name: 'Amit Kumar',
    email: 'amit.demo@example.com',
    password: 'demo123',
    class: '11',
    setupComplete: true
  }
];

// Demo configurations
const demoConfigs = [
  {
    learningStyle: 'visual',
    pace: 'moderate',
    interests: ['Science', 'Mathematics', 'Technology'],
    goals: ['Improve problem-solving skills', 'Prepare for competitive exams'],
    preferredLanguage: 'English',
    difficultyLevel: 'intermediate',
    studyTimePreference: 'evening'
  },
  {
    learningStyle: 'auditory',
    pace: 'slow',
    interests: ['Literature', 'History', 'Arts'],
    goals: ['Enhance reading comprehension', 'Develop critical thinking'],
    preferredLanguage: 'English',
    difficultyLevel: 'beginner',
    studyTimePreference: 'morning'
  },
  {
    learningStyle: 'kinesthetic',
    pace: 'fast',
    interests: ['Physics', 'Chemistry', 'Computer Science'],
    goals: ['Master advanced concepts', 'Excel in board exams'],
    preferredLanguage: 'English',
    difficultyLevel: 'advanced',
    studyTimePreference: 'afternoon'
  }
];

// Demo discussions
const demoDiscussions = [
  {
    title: 'Solving Quadratic Equations',
    content: 'How do I solve x² + 5x + 6 = 0? I understand the formula but need help applying it.',
    subject: 'Mathematics',
    chapter: 'Quadratic Equations',
    topic: 'Solving quadratic equations using formula'
  },
  {
    title: 'Understanding Photosynthesis',
    content: 'What are the main steps in photosynthesis? Can someone explain the light and dark reactions?',
    subject: 'Science',
    chapter: 'Photosynthesis',
    topic: 'Process of photosynthesis'
  },
  {
    title: 'Newton\'s Second Law',
    content: 'Can you explain F = ma with an example? I\'m confused about how force relates to acceleration.',
    subject: 'Physics',
    chapter: 'Newton\'s Laws',
    topic: 'Second law of motion'
  },
  {
    title: 'Periodic Trends Question',
    content: 'Why does atomic radius decrease across a period? What causes this trend?',
    subject: 'Chemistry',
    chapter: 'Periodic Table',
    topic: 'Periodic trends'
  }
];

// Demo conversations
const demoConversations = [
  {
    title: 'Understanding Linear Equations',
    subject: 'Mathematics',
    chapter: 'Algebra',
    messages: [
      {
        role: 'user' as const,
        content: 'Can you help me understand linear equations?',
        timestamp: new Date(Date.now() - 7200000)
      },
      {
        role: 'assistant' as const,
        content: 'Of course! Linear equations are equations where the highest power of the variable is 1. They form straight lines when graphed. Let\'s start with a simple example: 2x + 3 = 7',
        timestamp: new Date(Date.now() - 7100000)
      },
      {
        role: 'user' as const,
        content: 'How do I solve this?',
        timestamp: new Date(Date.now() - 7000000)
      },
      {
        role: 'assistant' as const,
        content: 'Great question! To solve 2x + 3 = 7:\n1. Subtract 3 from both sides: 2x = 4\n2. Divide both sides by 2: x = 2\nThat\'s your answer!',
        timestamp: new Date(Date.now() - 6900000)
      }
    ]
  },
  {
    title: 'Plant vs Animal Cells',
    subject: 'Science',
    chapter: 'Cell Biology',
    messages: [
      {
        role: 'user' as const,
        content: 'What is the difference between plant and animal cells?',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        role: 'assistant' as const,
        content: 'Excellent question! Here are the main differences:\n\n1. Cell Wall: Plant cells have a rigid cell wall, animal cells don\'t\n2. Chloroplasts: Plant cells have chloroplasts for photosynthesis\n3. Vacuoles: Plant cells have large central vacuoles\n4. Shape: Plant cells are rectangular, animal cells are round\n\nWould you like me to explain any of these in detail?',
        timestamp: new Date(Date.now() - 3500000)
      }
    ]
  }
];

// Demo progress data
const generateProgressData = (userId: mongoose.Types.ObjectId, userIndex: number) => {
  const subjects = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'English'];
  const chapters: Record<string, string[]> = {
    'Mathematics': ['Algebra', 'Geometry', 'Trigonometry', 'Calculus'],
    'Science': ['Cell Biology', 'Photosynthesis', 'Human Body', 'Ecology'],
    'Physics': ['Motion', 'Force', 'Energy', 'Electricity'],
    'Chemistry': ['Atoms', 'Periodic Table', 'Chemical Reactions', 'Acids and Bases'],
    'English': ['Grammar', 'Literature', 'Writing Skills', 'Comprehension']
  };

  const topicProgress = [];
  const quizScores = [];
  let totalLessons = 0;
  let totalQuizzes = 0;
  let totalTime = 0;
  let totalXP = 0;
  
  for (const subject of subjects) {
    const subjectChapters = chapters[subject];
    for (const chapter of subjectChapters) {
      const topic = `${subject} - ${chapter}`;
      const totalLessonsInTopic = 10;
      const lessonsCompleted = Math.floor(Math.random() * totalLessonsInTopic);
      const quizzesTaken = lessonsCompleted > 5 ? Math.floor(Math.random() * 3) : 0;
      const timeSpent = lessonsCompleted * (Math.floor(Math.random() * 20) + 10) * 60; // in seconds
      
      totalLessons += lessonsCompleted;
      totalQuizzes += quizzesTaken;
      totalTime += timeSpent;
      totalXP += lessonsCompleted * 25; // 25 XP per lesson
      
      topicProgress.push({
        topic,
        lessonsCompleted,
        totalLessons: totalLessonsInTopic,
        quizzesTaken,
        averageScore: quizzesTaken > 0 ? Math.floor(Math.random() * 30) + 70 : 0,
        timeSpent,
        lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        status: (lessonsCompleted === 0 ? 'not-started' : lessonsCompleted === totalLessonsInTopic ? 'completed' : 'in-progress') as 'not-started' | 'in-progress' | 'completed'
      });
      
      // Add quiz scores for completed quizzes
      for (let i = 0; i < quizzesTaken; i++) {
        const score = Math.floor(Math.random() * 5) + 5; // 5-10 correct answers
        const totalQuestions = 10;
        const percentage = (score / totalQuestions) * 100;
        totalXP += Math.round(percentage * 10); // XP based on quiz score
        
        quizScores.push({
          _id: new mongoose.Types.ObjectId(),
          quizId: `quiz_${subject.toLowerCase()}_${i + 1}`,
          quizTitle: `${chapter} Quiz ${i + 1}`,
          topic,
          score,
          totalQuestions,
          percentage,
          timeSpent: Math.floor(Math.random() * 300) + 180, // 3-8 minutes
          completedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          answers: []
        });
      }
    }
  }

  // Generate achievements based on progress
  const achievements = [];
  if (totalLessons >= 10) {
    achievements.push({
      _id: new mongoose.Types.ObjectId(),
      achievementId: 'first_10_lessons',
      title: 'Getting Started',
      description: 'Completed 10 lessons',
      category: 'milestone' as const,
      icon: '🎯',
      unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });
    totalXP += 50; // Bonus XP for achievement
  }
  
  if (totalQuizzes >= 5) {
    achievements.push({
      _id: new mongoose.Types.ObjectId(),
      achievementId: 'quiz_master',
      title: 'Quiz Master',
      description: 'Completed 5 quizzes',
      category: 'learning' as const,
      icon: '📝',
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });
    totalXP += 50; // Bonus XP for achievement
  }

  // Calculate streak (random for demo)
  const currentStreak = Math.floor(Math.random() * 7) + 1;
  const longestStreak = currentStreak + Math.floor(Math.random() * 5);

  return {
    userId,
    totalLessonsCompleted: totalLessons,
    totalQuizzesTaken: totalQuizzes,
    totalTimeSpent: totalTime,
    overallAverageScore: quizScores.length > 0 ? Math.round(quizScores.reduce((sum, q) => sum + q.percentage, 0) / quizScores.length) : 0,
    level: Math.floor(Math.sqrt(totalXP / 100)) + 1,
    experiencePoints: totalXP,
    quizScores,
    achievements,
    achievementCount: achievements.length,
    learningStreak: {
      currentStreak,
      longestStreak,
      lastActivityDate: new Date(),
      streakStartDate: new Date(Date.now() - currentStreak * 24 * 60 * 60 * 1000)
    },
    topicProgress,
    lastActivityAt: new Date()
  };
};

async function seedDemoData() {
  try {
    console.log('🌱 Starting demo data seeding...\n');

    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-learning-platform';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing demo data
    console.log('🧹 Clearing existing demo data...');
    await User.deleteMany({ email: { $regex: /\.demo@example\.com$/ } });
    console.log('✅ Cleared demo users\n');

    // Create demo users
    console.log('👥 Creating demo users...');
    const createdUsers = [];
    
    for (let i = 0; i < demoUsers.length; i++) {
      const userData = demoUsers[i];
      
      // Manually hash password to bypass minlength validation for demo purposes
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      // Save without validation to bypass password minlength check
      await user.save({ validateBeforeSave: false });
      
      createdUsers.push(user);
      console.log(`   ✓ Created user: ${user.name} (${user.email})`);

      // Create configuration for user
      await UserConfiguration.create({
        userId: user._id,
        ...demoConfigs[i]
      });
      console.log(`   ✓ Created configuration for ${user.name}`);
    }
    console.log(`\n✅ Created ${createdUsers.length} demo users\n`);

    // Create demo discussions
    console.log('💬 Creating demo discussions...');
    const createdDiscussions = [];
    
    for (let i = 0; i < demoDiscussions.length; i++) {
      const discussionData = demoDiscussions[i];
      const user = createdUsers[i % createdUsers.length];
      
      const discussion = await ClassDiscussion.create({
        classId: new mongoose.Types.ObjectId(), // Generate a class ID
        userId: user._id,
        title: discussionData.title,
        content: discussionData.content,
        subject: discussionData.subject,
        chapter: discussionData.chapter,
        topic: discussionData.topic,
        replies: Math.random() > 0.5 ? [
          {
            userId: createdUsers[(i + 1) % createdUsers.length]._id,
            content: 'This is a helpful response to your question. Let me explain step by step...',
            isAI: false,
            likes: [],
            createdAt: new Date(Date.now() - 3600000)
          }
        ] : [],
        likes: [],
        isPinned: false
      });
      
      createdDiscussions.push(discussion);
      console.log(`   ✓ Created discussion: ${discussion.title}`);
    }
    console.log(`\n✅ Created ${createdDiscussions.length} demo discussions\n`);

    // Create demo conversations
    console.log('🗨️  Creating demo conversations...');
    let conversationCount = 0;
    
    for (let i = 0; i < demoConversations.length; i++) {
      const convData = demoConversations[i];
      const user = createdUsers[i % createdUsers.length];
      
      await Conversation.create({
        userId: user._id,
        title: convData.title,
        messages: convData.messages,
        context: {
          topic: convData.chapter,
          language: 'English',
          difficulty: 'intermediate'
        }
      });
      
      conversationCount++;
      console.log(`   ✓ Created conversation: ${convData.title}`);
    }
    console.log(`\n✅ Created ${conversationCount} demo conversations\n`);

    // Create demo progress data
    console.log('📊 Creating demo progress data...');
    let progressCount = 0;
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const progressData = generateProgressData(user._id, i);
      await Progress.create(progressData);
      progressCount++;
      console.log(`   ✓ Created progress for ${user.name} (${progressData.totalLessonsCompleted} lessons, ${progressData.totalQuizzesTaken} quizzes)`);
    }
    console.log(`\n✅ Created ${progressCount} demo progress documents\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 Demo Data Seeding Complete!');
    console.log('═══════════════════════════════════════');
    console.log(`\n📋 Summary:`);
    console.log(`   • Users: ${createdUsers.length}`);
    console.log(`   • Discussions: ${createdDiscussions.length}`);
    console.log(`   • Conversations: ${conversationCount}`);
    console.log(`   • Progress Entries: ${progressCount}`);
    console.log(`\n🔑 Demo Login Credentials:`);
    demoUsers.forEach(user => {
      console.log(`   • ${user.email} / ${user.password}`);
    });
    console.log('\n');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run seeding
seedDemoData();
