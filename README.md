# Full-Stack Starter App 🚀

A simple message board application built with React (Vite) frontend and Express backend. Perfect for your first full-stack project!

## 🎯 Features

- Add messages
- View all messages
- Delete messages
- Real-time updates
- Beautiful, modern UI with animations

## 📁 Project Structure

```
fullstack-starter/
├── backend/           # Express server
│   ├── server.js     # Main server file
│   └── package.json
└── frontend/          # React + Vite app
    ├── src/
    │   ├── App.jsx   # Main component
    │   ├── App.css   # Styles
    │   ├── main.jsx  # Entry point
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

You'll need **two terminal windows** - one for backend, one for frontend:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
This starts the Express server on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
This starts the React app on `http://localhost:5173`

Open your browser and go to `http://localhost:5173` to see the app!

## 🔌 API Endpoints

- `GET /` - Health check
- `GET /api/messages` - Get all messages
- `POST /api/messages` - Create a new message
  - Body: `{ "text": "Your message" }`
- `DELETE /api/messages/:id` - Delete a message

## 🎨 Technologies Used

**Frontend:**
- React 18
- Vite
- CSS3 with animations

**Backend:**
- Node.js
- Express
- CORS middleware

## 📝 How It Works

1. The React frontend makes HTTP requests to the Express backend
2. The backend stores messages in memory (resets when server restarts)
3. CORS is enabled so the frontend can communicate with the backend
4. Changes are reflected immediately in the UI

## 🔧 Customization Ideas

- Add a database (MongoDB, PostgreSQL)
- Add user authentication
- Add message editing
- Add real-time updates with WebSockets
- Add message categories or tags
- Deploy to production (Vercel, Heroku, etc.)

## 🐛 Troubleshooting

**Port already in use?**
- Change the port in `backend/server.js` (line 5)
- Change the port in `frontend/vite.config.js` (line 6)
- Update the API_URL in `frontend/src/App.jsx` (line 10)

**Can't connect to backend?**
- Make sure both servers are running
- Check the backend is on port 3001
- Check CORS is enabled in server.js

## 📚 Next Steps

1. Try adding new features
2. Style the components your way
3. Add more API endpoints
4. Connect to a real database
5. Deploy your app online!

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Express Documentation](https://expressjs.com)
- [MDN Web Docs](https://developer.mozilla.org)

Happy coding! 🎉
