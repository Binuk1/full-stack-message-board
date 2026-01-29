const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'https://full-stack-message-board-flax.vercel.app',
  credentials: true
}));
app.use(express.json());

// Sample data
let messages = [
  { id: 1, text: 'Welcome to your first full-stack app!', timestamp: new Date().toISOString() },
  { id: 2, text: 'This is powered by Express backend', timestamp: new Date().toISOString() }
];

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Get all messages
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// Add a new message
app.post('/api/messages', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Message text is required' });
  }
  
  const newMessage = {
    id: messages.length + 1,
    text,
    timestamp: new Date().toISOString()
  };
  
  messages.push(newMessage);
  res.status(201).json(newMessage);
});

// Delete a message
app.delete('/api/messages/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = messages.findIndex(msg => msg.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  messages.splice(index, 1);
  res.json({ message: 'Message deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
