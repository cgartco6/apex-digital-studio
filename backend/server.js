// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');

dotenv.config();

// Import services
const revenueTracker = require('./services/revenueTracker');
const addictionEngine = require('./services/addictionEngine');
const autoPoster = require('./services/autoPoster');
const payoutEngine = require('./services/payoutEngine');
const megsService = require('./services/megsService');
const complianceService = require('./services/complianceService');
const aiValidationService = require('./services/aiValidationService');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const userRoutes = require('./routes/user.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const creatorRoutes = require('./routes/creator.routes');
const complianceRoutes = require('./routes/compliance.routes');
const payoutRoutes = require('./routes/payout.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

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
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('orderUpdate', (data) => io.emit('orderUpdate', data));
  socket.on('designUpdate', (data) => io.emit('designUpdate', data));
  socket.on('courseProgress', (data) => io.emit('courseProgress', data));
  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Megs chatbot namespace
const megsNamespace = io.of('/megs');
megsNamespace.use(authMiddleware.socketAuth);
megsNamespace.on('connection', (socket) => {
  socket.on('message', async (data) => {
    const response = await megsService.processMessage(data.userId, data.message);
    socket.emit('message', response.message);
  });
});

// Revenue tracking middleware (applies to order creation)
app.use('/api/orders', (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (req.method === 'POST' && res.statusCode === 201) {
      try {
        const order = JSON.parse(data).data;
        revenueTracker.trackRevenue(order);
        addictionEngine.rewardAction(req.user?.id, 'order_placed', order.total);
      } catch (err) {
        console.error('Revenue tracking error:', err);
      }
    }
    originalSend.apply(res, arguments);
  };
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', authMiddleware.protect, orderRoutes);
app.use('/api/payments', authMiddleware.protect, paymentRoutes);
app.use('/api/users', authMiddleware.protect, userRoutes);
app.use('/api/dashboard', authMiddleware.protect, dashboardRoutes);
app.use('/api/ai', authMiddleware.protect, aiRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/creator', authMiddleware.protect, creatorRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/admin/payouts', authMiddleware.protect, authMiddleware.restrictTo('admin'), payoutRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Apex Digital Studio API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start auto-poster in production
  if (process.env.NODE_ENV === 'production') {
    autoPoster.startAutoPosting();
    console.log('Auto-poster started');
  }
});

module.exports = { app, server };
