import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import * as types from "@google/genai";
import { GoogleGenAI } from "@google/genai";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Import configurations and utilities
import { initializeDatabase } from "./config/database";
import { generatePersonalizedPrompt, getGreetingMessage } from "./utils/aiPersonality";
import logger, { morganStream } from "./config/logger";

// Import middleware
import { errorHandler, notFoundHandler, handleUncaughtException, handleUnhandledRejection } from "./middleware/errorHandler";
import {
  sanitizeBody,
  preventParameterPollution,
  securityHeaders,
  logSuspiciousActivity,
  enforceHTTPS
} from "./middleware/security";

// Import routes
import authRoutes from "./routes/authRoutes";
import configRoutes from "./routes/configRoutes";
import discussionRoutes from "./routes/discussionRoutes";
import progressRoutes from "./routes/progressRoutes";

// Import models
import User, { IUser } from "./models/User";
import UserConfiguration from "./models/UserConfiguration";
import Conversation from "./models/Conversation";
import Discussion from "./models/Discussion";

// Load environment variables
dotenv.config();

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

/**
 * Extended Socket interface with user data
 */
interface AuthenticatedSocket extends Socket {
  userId?: mongoose.Types.ObjectId;
  user?: IUser;
  conversationId?: mongoose.Types.ObjectId;
}

/**
 * Creates an audio blob for Google Gemini AI from base64 audio data
 * @param audioData - Base64 encoded audio data string
 * @returns Blob object with audio data and PCM mime type
 * @example
 * const blob = createBlob(base64AudioString);
 */
export function createBlob(audioData: string): types.Blob {
  return { data: audioData, mimeType: "audio/pcm;rate=16000" };
}

/**
 * Helper function for debugging - converts objects to JSON strings
 * @param data - Object to stringify
 * @returns JSON string representation of the object
 * @example
 * console.log(debug({ user: 'John', status: 'active' }));
 */
export function debug(data: object): string {
  return JSON.stringify(data);
}

/**
 * Socket.io authentication middleware - verifies JWT token and attaches user to socket
 * @param socket - Socket.io socket instance
 * @param next - Callback function to continue or reject connection
 * @throws {Error} If authentication fails (no token, invalid token, or user not found)
 * @example
 * io.use(authenticateSocket);
 */
const authenticateSocket = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.userId = user._id;
    socket.user = user;

    console.log(`✅ Socket authenticated for user: ${user.email}`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Main application function - initializes and starts the AudioStreaming server
 * Sets up Express app, database connection, middleware, routes, Socket.io, and AI integration
 * @throws {Error} If database connection fails or required environment variables are missing
 * @example
 * main().catch(error => {
 *   logger.error('Fatal error:', error);
 *   process.exit(1);
 * });
 */
async function main() {
  logger.info('🚀 Starting AudioStreaming Server...');

  // Initialize database connection
  try {
    await initializeDatabase();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  // Validate required environment variables
  if (!process.env.GOOGLE_API_KEY) {
    logger.error('❌ GOOGLE_API_KEY is not set in environment variables');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET) {
    logger.warn('⚠️  JWT_SECRET is not set, using default (not recommended for production)');
  }

  // Initialize Express app
  const app: Express = express();

  // Trust proxy (for rate limiting and IP detection behind reverse proxy)
  app.set('trust proxy', 1);

  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use(enforceHTTPS);
  }

  // Security headers
  app.use(securityHeaders);

  // Helmet for additional security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        connectSrc: [
          "'self'",
          "http://localhost:3000",
          "http://localhost:8004",
          "ws://localhost:3000",
          "ws://localhost:8004",
          "https://generativelanguage.googleapis.com"
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',')
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }));

  // Request logging with Winston
  app.use(morgan('combined', { stream: morganStream }));

  // Body parsing middleware with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Sanitize request body
  app.use(sanitizeBody);

  // Prevent parameter pollution
  app.use(preventParameterPollution);

  // Log suspicious activity
  app.use(logSuspiciousActivity);

  // General rate limiting for API routes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting to API routes
  app.use('/api/', limiter);

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/discussions', discussionRoutes);
  app.use('/api/progress', progressRoutes);

  // Enhanced health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const healthData: any = {
        success: true,
        status: 'healthy',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        version: '1.0.0',
        services: {
          database: 'unknown',
          api: 'healthy'
        },
        system: {
          memory: {
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
          },
          cpu: process.cpuUsage(),
          nodeVersion: process.version
        }
      };

      // Check database connection
      try {
        const dbState = mongoose.connection.readyState;
        healthData.services.database = dbState === 1 ? 'connected' : 'disconnected';
        
        if (dbState === 1 && mongoose.connection.db) {
          // Ping database to verify it's responsive
          await mongoose.connection.db.admin().ping();
          healthData.services.database = 'healthy';
        }
      } catch (dbError) {
        healthData.services.database = 'unhealthy';
        healthData.status = 'degraded';
      }

      // Set appropriate status code
      const statusCode = healthData.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthData);
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Readiness probe endpoint (for Kubernetes/Docker)
  app.get('/api/ready', async (req: Request, res: Response): Promise<any> => {
    try {
      // Check if database is ready
      const dbState = mongoose.connection.readyState;
      if (dbState !== 1) {
        return res.status(503).json({
          ready: false,
          message: 'Database not ready'
        });
      }

      // Check if required environment variables are set
      if (!process.env.GOOGLE_API_KEY || !process.env.JWT_SECRET) {
        return res.status(503).json({
          ready: false,
          message: 'Required environment variables not set'
        });
      }

      return res.json({
        ready: true,
        message: 'Service is ready to accept traffic'
      });
    } catch (error) {
      return res.status(503).json({
        ready: false,
        message: 'Readiness check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Liveness probe endpoint (for Kubernetes/Docker)
  app.get('/api/live', (req: Request, res: Response) => {
    res.json({
      alive: true,
      timestamp: new Date().toISOString()
    });
  });

  // Serve static files from public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Serve original index.html at /audio-demo
  app.get("/audio-demo", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "./index.html"));
  });

  // Redirect root to login page
  app.get("/", (req: Request, res: Response) => {
    res.redirect('/pages/login.html');
  });

  // 404 handler for undefined routes
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io with authentication
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') 
        : "*",
      credentials: true,
    },
  });

  // Apply authentication middleware to all socket connections
  io.use(authenticateSocket);

  // Store active AI sessions per socket
  const activeSessions = new Map<string, any>();

  // Handle socket connections
  io.on("connection", async (socket: AuthenticatedSocket) => {
    console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user?.email})`);

    try {
      // Load user configuration for AI personality
      const userConfig = await UserConfiguration.findOne({ userId: socket.userId });
      
      // Map user configuration to personality ID
      // For now, we'll use a simple mapping based on tone
      const personalityMap: Record<string, string> = {
        'friendly': 'friendly_teacher',
        'professional': 'strict_professor',
        'casual': 'fun_buddy',
        'formal': 'strict_professor',
      };

      const personalityId = userConfig 
        ? personalityMap[userConfig.aiPersonality.tone] || 'friendly_teacher'
        : 'friendly_teacher';

      // Generate personalized system prompt
      const systemPrompt = generatePersonalizedPrompt(personalityId, {
        name: socket.user?.name,
        proficiencyLevel: userConfig?.learningPreferences.difficultyLevel,
        learningGoals: userConfig?.learningPreferences.focusAreas,
      });

      console.log(`🤖 Initializing AI session with personality: ${personalityId}`);

      // Initialize Google AI session with personalized prompt
      const aiOptions: types.GoogleGenAIOptions = {
        vertexai: false,
        apiKey: process.env.GOOGLE_API_KEY!,
        httpOptions: {
          apiVersion: "v1alpha",
        },
      };

      const ai = new GoogleGenAI(aiOptions);
      const session = await ai.live.connect({
        model: "gemini-2.0-flash-exp",
        config: {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
        },
        callbacks: {
          onopen: () => {
            console.log(`✅ AI Session opened for socket: ${socket.id}`);
          },
          onmessage: (message: types.LiveServerMessage) => {
            // Send audio stream back to client
            if (
              message.serverContent &&
              message.serverContent.modelTurn &&
              message.serverContent.modelTurn.parts &&
              message.serverContent.modelTurn.parts.length > 0 &&
              message.serverContent.modelTurn.parts[0].inlineData &&
              message.serverContent.modelTurn.parts[0].inlineData.data
            ) {
              socket.emit(
                "audioStream",
                message.serverContent.modelTurn.parts[0].inlineData.data
              );
            }

            // Extract text content for conversation logging
            if (
              message.serverContent &&
              message.serverContent.modelTurn &&
              message.serverContent.modelTurn.parts
            ) {
              const textParts = message.serverContent.modelTurn.parts
                .filter(part => part.text)
                .map(part => part.text)
                .join(' ');

              if (textParts && socket.conversationId) {
                // Save assistant message to database
                Conversation.findById(socket.conversationId)
                  .then(conversation => {
                    if (conversation) {
                      conversation.addMessage({
                        role: 'assistant',
                        content: textParts,
                        timestamp: new Date(),
                      });
                    }
                  })
                  .catch(err => console.error('Error saving assistant message:', err));
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error(`❌ AI Session error for socket ${socket.id}:`, e);
            socket.emit('error', { message: 'AI session error occurred' });
          },
          onclose: (e: CloseEvent) => {
            console.log(`🔌 AI Session closed for socket ${socket.id}`);
          },
        },
      });

      // Store session for this socket
      activeSessions.set(socket.id, session);

      // Create or get active conversation
      let conversation = await Conversation.findOne({
        userId: socket.userId,
        isActive: true,
      }).sort({ lastMessageAt: -1 });

      if (!conversation) {
        conversation = await Conversation.create({
          userId: socket.userId,
          title: `Conversation ${new Date().toLocaleDateString()}`,
          context: {
            language: userConfig?.language || 'en',
            difficulty: userConfig?.learningPreferences.difficultyLevel || 'beginner',
          },
        });
        console.log(`📝 Created new conversation: ${conversation._id}`);
      }

      socket.conversationId = conversation._id;

      // Send greeting message
      const greetingMessage = getGreetingMessage(personalityId);
      socket.emit('greeting', {
        message: greetingMessage,
        personality: personalityId,
        conversationId: conversation._id,
      });

      // Handle text content updates
      socket.on("contentUpdateText", async (text: string) => {
        console.log(`📝 Text received from ${socket.user?.email}: ${text.substring(0, 50)}...`);
        
        // Save user message to conversation
        if (socket.conversationId) {
          try {
            const conv = await Conversation.findById(socket.conversationId);
            if (conv) {
              await conv.addMessage({
                role: 'user',
                content: text,
                timestamp: new Date(),
              });
            }
          } catch (err) {
            console.error('Error saving user message:', err);
          }
        }

        // Send to AI
        session.sendClientContent({ turns: text, turnComplete: true });
      });

      // Handle realtime audio input
      socket.on("realtimeInput", (audioData: string) => {
        session.sendRealtimeInput({ media: createBlob(audioData) });
      });

      // Handle discussion updates
      socket.on("discussionUpdate", async (data: { discussionId: string; action: string }) => {
        try {
          // Broadcast to all connected clients in the same discussion
          io.emit(`discussion:${data.discussionId}`, {
            action: data.action,
            userId: socket.userId,
            timestamp: new Date(),
          });
        } catch (err) {
          console.error('Error handling discussion update:', err);
        }
      });

      // Handle conversation archiving
      socket.on("archiveConversation", async () => {
        if (socket.conversationId) {
          try {
            const conv = await Conversation.findById(socket.conversationId);
            if (conv) {
              await conv.archive();
              socket.emit('conversationArchived', { conversationId: conv._id });
            }
          } catch (err) {
            console.error('Error archiving conversation:', err);
          }
        }
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(`🔌 Socket disconnected: ${socket.id} (User: ${socket.user?.email})`);
        
        // Clean up AI session
        const session = activeSessions.get(socket.id);
        if (session) {
          try {
            // Close the session if it has a close method
            if (typeof session.close === 'function') {
              session.close();
            }
          } catch (err) {
            console.error('Error closing AI session:', err);
          }
          activeSessions.delete(socket.id);
        }
      });

    } catch (error) {
      console.error('❌ Error setting up socket connection:', error);
      socket.emit('error', { message: 'Failed to initialize AI session' });
      socket.disconnect();
    }
  });

  // Start server
  const port = process.env.PORT || 8004;
  server.listen(port, () => {
    logger.info(`⚡️[server]: Server is running at http://localhost:${port}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Not set'}`);
    logger.info(`🤖 Google API Key: ${process.env.GOOGLE_API_KEY ? '✓ Set' : '✗ Not set'}`);
    logger.info(`💾 MongoDB: ${process.env.MONGODB_URI ? '✓ Connected' : '✗ Not connected'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.warn('⚠️  SIGTERM received, shutting down gracefully...');
    
    // Close all active AI sessions
    activeSessions.forEach((session, socketId) => {
      try {
        if (typeof session.close === 'function') {
          session.close();
        }
      } catch (err) {
        logger.error(`Error closing session for socket ${socketId}:`, err);
      }
    });
    activeSessions.clear();

    // Close server
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    logger.warn('⚠️  SIGINT received, shutting down gracefully...');
    
    // Close all active AI sessions
    activeSessions.forEach((session, socketId) => {
      try {
        if (typeof session.close === 'function') {
          session.close();
        }
      } catch (err) {
        logger.error(`Error closing session for socket ${socketId}:`, err);
      }
    });
    activeSessions.clear();

    // Close server
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });
}

// Start the application
main().catch((error) => {
  logger.error('❌ Fatal error starting server:', error);
  process.exit(1);
});
