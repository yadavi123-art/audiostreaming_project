import mongoose from 'mongoose';

/**
 * Database connection configuration and management
 */
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Connect to MongoDB database
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('📦 Database already connected');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      // Connection options
      const options = {
        maxPoolSize: 10,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4, // Use IPv4, skip trying IPv6
      };

      await mongoose.connect(mongoUri, options);
      this.isConnected = true;

      console.log('✅ MongoDB connected successfully');
      if (mongoose.connection.db) {
        console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);
      }
      console.log(`🔗 Host: ${mongoose.connection.host}`);
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🔌 MongoDB disconnected');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Setup connection event handlers
   */
  public setupEventHandlers(): void {
    // Connected event
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    // Disconnected event
    mongoose.connection.on('disconnected', () => {
      console.log('🔴 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Error event
    mongoose.connection.on('error', (error) => {
      console.error('🔥 Mongoose connection error:', error);
      this.isConnected = false;
    });

    // Reconnected event
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Process termination handlers
    process.on('SIGINT', async () => {
      await this.disconnect();
      console.log('👋 Application terminated, database connection closed');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      console.log('👋 Application terminated, database connection closed');
      process.exit(0);
    });
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

/**
 * Initialize database connection with event handlers
 */
export const initializeDatabase = async (): Promise<void> => {
  dbConnection.setupEventHandlers();
  await dbConnection.connect();
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  await dbConnection.disconnect();
};

/**
 * Get database connection status
 */
export const isDatabaseConnected = (): boolean => {
  return dbConnection.getConnectionStatus();
};

export default dbConnection;
