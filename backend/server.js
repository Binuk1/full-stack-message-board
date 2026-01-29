const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ====================
// MongoDB Connection - PRODUCTION ONLY
// ====================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ CRITICAL: MONGODB_URI environment variable is not set!');
  console.error('Please set MONGODB_URI in your Vercel environment variables');
  console.error('Use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
}

// Cache the connection for serverless functions
let cachedDb = null;

const connectDB = async () => {
  // Return cached connection if available
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  // Validate MongoDB URI
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not configured');
    throw new Error('Database configuration missing. Please set MONGODB_URI environment variable.');
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });

    cachedDb = conn;
    
    console.log('✅ MongoDB Atlas connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      cachedDb = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      cachedDb = null;
    });

    return conn;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
    
    // Provide helpful error messages
    if (err.message.includes('ENOTFOUND')) {
      console.error('💡 TIP: Check your MongoDB Atlas connection string');
      console.error('💡 TIP: Make sure your IP is whitelisted in MongoDB Atlas');
      console.error('💡 TIP: Check if your MongoDB Atlas cluster is running');
    }
    
    if (err.message.includes('authentication')) {
      console.error('💡 TIP: Check your MongoDB Atlas username and password');
      console.error('💡 TIP: Make sure the database user has correct permissions');
    }
    
    cachedDb = null;
    throw err;
  }
};

// ====================
// Database Schema
// ====================
const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Create index for better query performance
messageSchema.index({ timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

// ====================
// Initialize Database
// ====================
const initializeDatabase = async () => {
  if (!MONGODB_URI) {
    console.warn('⚠️ Skipping database initialization - MONGODB_URI not set');
    return;
  }

  try {
    await connectDB();
    
    // Create collection if it doesn't exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionExists = collections.some(c => c.name === 'messages');
    
    if (!collectionExists) {
      console.log('📁 Creating messages collection...');
      await Message.createCollection();
      console.log('✅ Messages collection created');
    }
    
    // Create a welcome message if collection is empty
    const count = await Message.countDocuments();
    if (count === 0) {
      await Message.create({
        text: 'Welcome to the Message Board! 🎉',
        timestamp: new Date()
      });
      console.log('✅ Welcome message created');
    }
    
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }
};

// Initialize on startup (for serverless, this runs on first request)
initializeDatabase();

// ====================
// Middleware
// ====================
// CORS configuration - Allow your frontend Vercel domain
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Get frontend URL from environment or default to common Vercel patterns
    const frontendUrl = process.env.FRONTEND_URL;
    const allowedOrigins = [
      frontendUrl,
      'https://*.vercel.app' // Allow all Vercel deployments
    ].filter(Boolean);

    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      // Exact match
      if (origin === allowed) return true;
      
      // Wildcard matching for Vercel
      if (allowed === 'https://*.vercel.app' && origin.endsWith('.vercel.app')) {
        return true;
      }
      
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🛑 CORS blocked origin: ${origin}`);
      console.warn(`💡 Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ====================
// Routes
// ====================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Message Board API',
    status: 'online',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    deployed: true,
    database: MONGODB_URI ? 'configured' : 'not_configured',
    endpoints: {
      health: '/api/health',
      messages: '/api/messages',
      debug: '/api/debug'
    },
    documentation: 'This is a production API deployed on Vercel. Use the endpoints above.'
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    deployment: 'vercel',
    region: process.env.VERCEL_REGION || 'unknown',
    database: {
      configured: !!MONGODB_URI,
      connected: false,
      state: 'unknown'
    }
  };

  try {
    if (!MONGODB_URI) {
      healthCheck.status = 'unhealthy';
      healthCheck.database.error = 'MONGODB_URI environment variable is not set';
      return res.status(503).json(healthCheck);
    }

    const db = await connectDB();
    
    if (db && mongoose.connection.readyState === 1) {
      healthCheck.database.connected = true;
      healthCheck.database.state = 'connected';
      
      // Test database with a simple query
      const pingStart = Date.now();
      await mongoose.connection.db.command({ ping: 1 });
      const pingTime = Date.now() - pingStart;
      
      healthCheck.database.pingMs = pingTime;
      healthCheck.database.messageCount = await Message.countDocuments();
      healthCheck.status = 'healthy';
      
      res.json(healthCheck);
    } else {
      healthCheck.status = 'unhealthy';
      healthCheck.database.state = mongoose.connection.readyState;
      healthCheck.database.error = 'Failed to establish database connection';
      res.status(503).json(healthCheck);
    }
  } catch (err) {
    healthCheck.status = 'unhealthy';
    healthCheck.database.error = err.message;
    healthCheck.database.state = mongoose.connection.readyState;
    res.status(503).json(healthCheck);
  }
});

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    if (!MONGODB_URI) {
      return res.status(503).json({
        error: 'Database not configured',
        message: 'MONGODB_URI environment variable is missing. Please configure MongoDB Atlas.'
      });
    }

    const db = await connectDB();
    
    if (!db || mongoose.connection.readyState !== 1) {
      // Graceful degradation: return empty array
      return res.json([]);
    }
    
    const messages = await Message.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();
    
    res.json(messages);
    
  } catch (err) {
    console.error('Error fetching messages:', err.message);
    
    // Graceful degradation for database errors
    if (err.name.includes('Mongo')) {
      return res.json([]);
    }
    
    res.status(500).json({
      error: 'Failed to fetch messages',
      message: 'Please try again later'
    });
  }
});

// Add a new message
app.post('/api/messages', async (req, res) => {
  try {
    if (!MONGODB_URI) {
      return res.status(503).json({
        error: 'Database not configured',
        message: 'Please configure MongoDB Atlas connection'
      });
    }

    const db = await connectDB();
    
    if (!db || mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database unavailable',
        message: 'Cannot connect to database. Please try again later.'
      });
    }
    
    const { text } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid message',
        message: 'Message text is required and cannot be empty'
      });
    }
    
    const newMessage = new Message({
      text: text.trim(),
      timestamp: new Date()
    });
    
    const savedMessage = await newMessage.save();
    
    res.status(201).json(savedMessage);
    
  } catch (err) {
    console.error('Error adding message:', err.message);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: err.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to add message',
      message: 'Please try again later'
    });
  }
});

// Delete a message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    if (!MONGODB_URI) {
      return res.status(503).json({
        error: 'Database not configured'
      });
    }

    const db = await connectDB();
    
    if (!db || mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: 'Database unavailable'
      });
    }
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid message ID'
      });
    }
    
    const result = await Message.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({
        error: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (err) {
    console.error('Error deleting message:', err.message);
    res.status(500).json({
      error: 'Failed to delete message'
    });
  }
});

// Debug endpoint - for troubleshooting production issues
app.get('/api/debug', async (req, res) => {
  const debugInfo = {
    deployment: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      vercel: {
        isVercel: !!process.env.VERCEL,
        region: process.env.VERCEL_REGION,
        url: process.env.VERCEL_URL,
        gitCommit: process.env.VERCEL_GIT_COMMIT_SHA
      }
    },
    database: {
      hasMongoUri: !!MONGODB_URI,
      uriLength: MONGODB_URI ? MONGODB_URI.length : 0,
      connectionState: mongoose.connection.readyState,
      cachedDbExists: !!cachedDb
    },
    request: {
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      method: req.method,
      url: req.url
    }
  };
  
  // Add database info if connected
  if (mongoose.connection.readyState === 1) {
    try {
      debugInfo.database.collections = await mongoose.connection.db
        .listCollections()
        .toArray()
        .then(cols => cols.map(c => c.name));
      
      debugInfo.database.messageCount = await Message.countDocuments();
      
      // Sample recent message
      const recentMessage = await Message.findOne().sort({ timestamp: -1 });
      if (recentMessage) {
        debugInfo.database.recentMessage = {
          id: recentMessage._id,
          text: recentMessage.text.substring(0, 50) + '...',
          timestamp: recentMessage.timestamp
        };
      }
    } catch (dbErr) {
      debugInfo.database.error = dbErr.message;
    }
  }
  
  res.json(debugInfo);
});

// Handle preflight requests
app.options('*', cors(corsOptions));

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      'GET  /',
      'GET  /api/health',
      'GET  /api/messages',
      'POST /api/messages',
      'DELETE /api/messages/:id',
      'GET  /api/debug'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Production Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    origin: req.headers.origin
  });
  
  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS Error',
      message: `Origin ${req.headers.origin} is not allowed`,
      fix: 'Contact the API administrator to add your domain to CORS whitelist'
    });
  }
  
  // Production error response (don't leak details)
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong. Please try again later.',
    reference: new Date().getTime() // Simple error reference
  });
});

// ====================
// Export for Vercel
// ====================
// No app.listen() - Vercel handles the serverless function
module.exports = app;