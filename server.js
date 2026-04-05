require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')
const http = require('http')
const { Server } = require('socket.io')

const config = require('./config')
const passport = require('./server/passport')

const authRoutes = require('./routes/API/authAPI/auth')
const contentRoutes = require('./routes/API/contentAPI/content')
const watchlistRoutes = require('./routes/API/watchlistAPI/watchlist')
const reviewRoutes = require('./routes/API/reviewAPI/review')
const ratingRoutes = require('./routes/API/ratingAPI/rating')
const postRoutes = require('./routes/API/postAPI/post')
const feedRoutes = require('./routes/API/feedAPI/feed')
const communityRoutes = require('./routes/API/communityAPI/community')
const userRoutes = require('./routes/API/userAPI/user')
const notificationRoutes = require('./routes/API/notificationAPI/notification')
const listRoutes = require('./routes/API/listAPI/list')
const listRatingRoutes = require('./routes/API/listRatingAPI/listRating')
const activityRoutes = require('./routes/API/activityAPI/activity')
const reactionRoutes = require('./routes/API/reactionAPI/reaction')
const watchPartyRoutes = require('./routes/API/watchPartyAPI/watchParty')
const importRoutes = require('./routes/API/importAPI/import')

const app = express()
const server = http.createServer(app)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true
  }
})

const PORT = process.env.PORT || 3001
const MONGODB_URI = process.env.MONGODB_URI || config.db

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

// Security & logging
app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('dev'))
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'thewire-dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}))

// Auth rate limiter
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })

// Passport
app.use(passport.initialize())
app.use(passport.session())

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/watchlist', watchlistRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/ratings', ratingRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/feed', feedRoutes)
app.use('/api/communities', communityRoutes)
app.use('/api/users', userRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/lists', listRoutes)
app.use('/api/list-ratings', listRatingRoutes)
app.use('/api/activity', activityRoutes)
app.use('/api/reactions', reactionRoutes)
app.use('/api/watch-parties', watchPartyRoutes)
app.use('/api/import', importRoutes)

const watchPartyController = require('./controllers/watchPartyController')

// Socket.io
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)
  socket.on('join_community', (slug) => socket.join(`community:${slug}`))
  socket.on('leave_community', (slug) => socket.leave(`community:${slug}`))
  socket.on('join_user_room', (userId) => { socket.userId = userId; socket.join(`user:${userId}`) })
  socket.on('leave_user_room', (userId) => socket.leave(`user:${userId}`))

  // Watch party rooms
  socket.on('join_party', (partyId) => socket.join(`party:${partyId}`))
  socket.on('leave_party', (partyId) => socket.leave(`party:${partyId}`))
  socket.on('party_message', ({ partyId, text }) => {
    if (!socket.userId || !partyId || !text?.trim()) return
    watchPartyController.handleMessage(io, socket, { partyId, text })
  })

  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id))
})

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
  })
}

// Export io for use in controllers
app.set('io', io)

server.listen(PORT, () => {
  console.log(`API Server listening on PORT ${PORT}`)
})

module.exports = { app, io }
