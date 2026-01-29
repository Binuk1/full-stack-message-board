const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configured
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// In-memory message storage
let messages = [
  { 
    _id: '1', 
    text: 'Welcome to your message board!', 
    timestamp: new Date().toISOString() 
  },
  { 
    _id: '2', 
    text: 'This is powered by Express backend', 
    timestamp: new Date().toISOString() 
  }
];

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Get all messages
app.get('/api/messages', (req, res) => {
  try {
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Add a new message
app.post('/api/messages', (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    
    const newMessage = {
      _id: Date.now().toString(),
      text,
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Delete a message
app.delete('/api/messages/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const index = messages.findIndex(msg => msg._id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    messages.splice(index, 1);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
