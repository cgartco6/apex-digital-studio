const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const sendEmail = require('../services/email.service');
const { assignAIAgent } = require('../services/ai.service');

// Create order
exports.createOrder = asyncHandler(async (req, res) => {
  const { 
    items, 
    shippingAddress, 
    billingAddress, 
    paymentMethod,
    notes 
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No items in order'
    });
  }

  // Calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found: ${item.product}`
      });
    }

    const price = product.discountPrice || product.price;
    const itemTotal = price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      price,
      quantity: item.quantity,
      designSpecs: item.designSpecs || {},
      aiCustomizations: item.aiCustomizations || []
    });

    subtotal += itemTotal;

    // Update product sales count
    product.salesCount += item.quantity;
    await product.save();
  }

  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax;

  // Create order
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    subtotal,
    tax,
    total,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    notes,
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  // Add initial timeline event
  await order.addTimelineEvent(
    'pending',
    'Order created successfully',
    'system'
  );

  // Assign AI agent for design work
  if (order.items.some(item => item.designSpecs)) {
    const aiAgent = await assignAIAgent(order._id, 'design');
    order.aiAssigned = aiAgent;
    await order.save();
    
    await order.addTimelineEvent(
      'processing',
      'AI design agent assigned',
      aiAgent.name
    );
  }

  // Send confirmation email
  try {
    await sendEmail({
      email: req.user.email,
      subject: 'Order Confirmation - Apex Digital Studio',
      template: 'order-confirmation',
      data: {
        name: req.user.firstName,
        orderId: order.orderId,
        total: order.total,
        items: order.items,
        estimatedCompletion: order.estimatedCompletion
      }
    });
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }

  res.status(201).json({
    success: true,
    data: order
  });
});

// Get all orders for user
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (status) filter.orderStatus = status;

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('items.product', 'name images category');

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: orders
  });
});

// Get single order
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('items.product', 'name images category description');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// Update order status (admin/agent)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  order.orderStatus = status;
  
  if (status === 'completed') {
    order.completedAt = new Date();
  }

  await order.save();

  // Add timeline event
  await order.addTimelineEvent(
    status,
    message || `Order status updated to ${status}`,
    req.user.role === 'agent' ? req.user.name : 'admin'
  );

  // Notify user if status changed to important states
  const notifyStatuses = ['processing', 'designing', 'review', 'completed'];
  if (notifyStatuses.includes(status)) {
    try {
      const user = await User.findById(order.user);
      
      await sendEmail({
        email: user.email,
        subject: `Order Update: ${order.orderId}`,
        template: 'order-update',
        data: {
          name: user.firstName,
          orderId: order.orderId,
          status,
          message: message || `Your order is now ${status}`,
          timelineUrl: `${process.env.FRONTEND_URL}/dashboard/orders/${order._id}`
        }
      });
    } catch (error) {
      console.error('Failed to send status update email:', error);
    }
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// Upload design files
exports.uploadDesignFiles = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const order = await Order.findOne({
    _id: orderId,
    user: req.user.id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const orderItem = order.items.id(itemId);
  if (!orderItem) {
    return res.status(404).json({
      success: false,
      message: 'Order item not found'
    });
  }

  // Add files to item
  files.forEach(file => {
    orderItem.files.push({
      url: file.location || `/uploads/${file.filename}`,
      name: file.originalname,
      type: file.mimetype,
      uploadedAt: new Date()
    });
  });

  // Update item status
  orderItem.status = 'review';
  
  await order.save();

  // Add timeline event
  await order.addTimelineEvent(
    'review',
    'Design files uploaded for review',
    req.user.name || 'client'
  );

  res.status(200).json({
    success: true,
    message: 'Files uploaded successfully',
    data: orderItem.files
  });
});

// Request revision
exports.requestRevision = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { feedback } = req.body;

  const order = await Order.findOne({
    _id: orderId,
    user: req.user.id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  const orderItem = order.items.id(itemId);
  if (!orderItem) {
    return res.status(404).json({
      success: false,
      message: 'Order item not found'
    });
  }

  // Check revision limit
  if (orderItem.revisionsUsed >= orderItem.revisions) {
    return res.status(400).json({
      success: false,
      message: 'Revision limit reached'
    });
  }

  // Update item
  orderItem.status = 'revision';
  orderItem.revisionsUsed += 1;
  orderItem.feedback = feedback;

  // Update order status
  order.orderStatus = 'revision';
  
  await order.save();

  // Add timeline event
  await order.addTimelineEvent(
    'revision',
    `Revision requested: ${feedback}`,
    req.user.name || 'client'
  );

  // Notify AI agent
  if (order.aiAssigned) {
    // Trigger AI agent to process revision
    // This would connect to your AI agent service
  }

  res.status(200).json({
    success: true,
    message: 'Revision requested successfully',
    data: orderItem
  });
});

// Cancel order
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if order can be cancelled
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Order cannot be cancelled at this stage'
    });
  }

  order.orderStatus = 'cancelled';
  await order.save();

  // Add timeline event
  await order.addTimelineEvent(
    'cancelled',
    'Order cancelled by client',
    req.user.name || 'client'
  );

  // Process refund if payment was made
  if (order.paymentStatus === 'completed') {
    // This would connect to payment service for refund
    order.paymentStatus = 'refunded';
    await order.save();
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully'
  });
});

// Get order analytics for dashboard
exports.getOrderAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let filter = {};
  if (userRole === 'client') {
    filter = { user: userId };
  }

  const stats = await Order.getDashboardStats(userRole === 'admin' ? null : userId);

  // Get recent orders
  const recentOrders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'firstName lastName email');

  res.status(200).json({
    success: true,
    data: {
      stats: stats[0],
      recentOrders
    }
  });
});
