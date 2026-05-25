const dotenv = require('dotenv');
dotenv.config(); // ← Must be loaded FIRST before any module that reads process.env

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first'); // Force IPv4 first inside Docker to prevent ENETUNREACH
}

const express = require('express');

const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');

const connectDB = require('./config/database');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Required when running behind a reverse proxy (Nginx, Railway, Render, etc.)
// Allows Express to correctly detect HTTPS and set secure cookies
app.set('trust proxy', 1);

// Allow requests from the frontend URL (set via env var for prod, fallback for local dev)
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const resumeRoutes = require('./routes/resume');
const chatRoutes = require('./routes/chat');
const authRoutes = require('./routes/auth');

app.use('/api/resume', resumeRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint (useful for Docker & Railway)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

app.get('/', (req, res) => {
  res.send('ApplyEdge API is running!');
});

app.listen(PORT, () => {
  console.log(`ApplyEdge server started on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});