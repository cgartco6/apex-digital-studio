const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const socketIo = require('socket.io');
const http = require('http');
const revenueTracker = require('./services/revenueTracker');
const viralReferral = require('./services/viralReferral');

app.get('/api/referral/link', authMiddleware.protect, async (req, res) => {
  try {
    const data = await viralReferral.generateReferralLink(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/referral/track-click/:code', async (req, res) => {
  try {
    const data = await viralReferral.trackReferralClick(
      req.params.code,
      req.ip,
      req.headers['user-agent']
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/referral/process-sale', authMiddleware.protect, async (req, res) => {
  try {
    const { referralCode, amount } = req.body;
    const data = await viralReferral.processReferralSale(
      referralCode,
      req.user.id,
      amount
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/referral/leaderboard', async (req, res) => {
  try {
    const leaderboard = await viralReferral.getLeaderboard();
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/referral/stats', authMiddleware.protect, async (req, res) => {
  try {
    const stats = await viralReferral.getReferralStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add middleware to track revenue
app.use('/api/orders', (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (req.method === 'POST' && res.statusCode === 201) {
      try {
        const order = JSON.parse(data).data;
        revenueTracker.trackRevenue(order);
      } catch (error) {
        console.error('Revenue tracking error:', error);
      }
    }
    originalSend.apply(res, arguments);
  };
  next();
});

// Add revenue endpoint
app.get('/api/revenue/metrics', authMiddleware.protect, authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const metrics = revenueTracker.getCurrentMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/revenue/report', authMiddleware.protect, authMiddleware.restrictTo('admin'), async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const report = await revenueTracker.generateRevenueReport(period, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apex-digital', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle real-time updates
  socket.on('orderUpdate', (data) => {
    io.emit('orderUpdate', data);
  });
  
  socket.on('designUpdate', (data) => {
    io.emit('designUpdate', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', authMiddleware.protect, orderRoutes);
app.use('/api/payments', authMiddleware.protect, paymentRoutes);
app.use('/api/users', authMiddleware.protect, userRoutes);
app.use('/api/dashboard', authMiddleware.protect, dashboardRoutes);
app.use('/api/ai', authMiddleware.protect, aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Apex Digital Studio API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for testing
module.exports = { app, server };
// Add this after other route imports
app.use('/api/marketplace', require('./routes/marketplace.routes'));
