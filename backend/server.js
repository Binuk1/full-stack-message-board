const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messageboard';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
};

// Message Schema and Model
const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Get all messages
app.get('/api/messages', async (req, res) => {
  try {
    await connectDB();
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
});

// Add a new message
app.post('/api/messages', async (req, res) => {
  try {
    await connectDB();
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    const newMessage = new Message({ text });
    await newMessage.save();
    
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Add message error:', err);
    res.status(500).json({ error: 'Failed to add message', details: err.message });
  }
});

// Delete a message
app.delete('/api/messages/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    
    const message = await Message.findByIdAndDelete(id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete message', details: err.message });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

module.exports = app;
