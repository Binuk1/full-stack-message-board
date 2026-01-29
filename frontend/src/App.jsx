import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL = 'https://full-stack-message-board-production.up.railway.app/'
  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      console.log('📥 Fetching messages...')
      const response = await fetch(`${API_URL}api/messages`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ Messages received:', data)
      setMessages(data)
      setError(null)
    } catch (err) {
      console.error('❌ Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      console.log('📤 Sending message:', newMessage)
      
      const response = await fetch(`${API_URL}api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage })
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Failed to add message: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Message added:', data)
      
      setMessages([...messages, data])
      setNewMessage('')
    } catch (err) {
      console.error('❌ Add message error:', err)
      setError(err.message)
    }
  }

  const handleDeleteMessage = async (id) => {
    try {
      console.log(`🗑️ Deleting message with ID: ${id}`)
      console.log('Current messages:', messages)
      
      const response = await fetch(`${API_URL}api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('Delete response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete failed:', errorText)
        throw new Error(`Failed to delete: ${response.status} - ${errorText}`)
      }
      
      const result = await response.json()
      console.log('✅ Delete successful:', result)
      
      setMessages(messages.filter(msg => msg.id !== id))
    } catch (err) {
      console.error('❌ Delete error:', err)
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">Message Board</h1>
          <p className="subtitle">Your First Full-Stack Application</p>
        </header>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleAddMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message here..."
            className="message-input"
          />
          <button type="submit" className="submit-btn">
            Send
          </button>
        </form>

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>No messages yet. Be the first to post!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={message.id} 
                className="message-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="message-content">
                  <p className="message-text">{message.text}</p>
                  <span className="message-time">
                    ID: {message.id} | {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <button 
                  onClick={() => handleDeleteMessage(message.id)}
                  className="delete-btn"
                  aria-label="Delete message"
                  title={`Delete message ${message.id}`}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <strong>Debug Info:</strong><br/>
          Total messages: {messages.length}<br/>
          Message IDs: {messages.map(m => m.id).join(', ')}
        </div>
      </div>
    </div>
  )
}

export default App