process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT:', err.stack);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
const { generalLimiter } = require('./src/middleware/ratelimiter');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
// Connect to MongoDB
connectDB();

const app = express();

// Global Middleware
app.use(cors({
  origin: [
      "http://localhost:5173",
      "https://your-app.vercel.app"
    ],
    credentials: true
}

));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static('uploads'));
//app.use(generalLimiter);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Banking API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);

// 404 & Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Error:', err.message);
  server.close(() => process.exit(1));
});

app.post('/test', (req, res) => res.json({ success: true, body: req.body }));
module.exports = app;