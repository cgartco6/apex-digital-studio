const Order = require('../../models/Order');
const Listing = require('../../models/Listing');
const Vendor = require('../../models/Vendor');
const User = require('../../models/User');
const asyncHandler = require('express-async-handler');
const { processPayment } = require('../../services/payment.service');
const addictionEngine = require('../../services/addictionEngine'); // assuming you have this

// Create marketplace order
exports.createMarketplaceOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, billingAddress, paymentMethod, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items' });
  }

  // Validate items and calculate totals
  let subtotal = 0;
  const orderItems = [];
  const vendorTotals = {};

  for (const item of items) {
    const listing = await Listing.findOne({ _id: item.listingId, status: 'approved', isActive: true });
    if (!listing) {
      return res.status(404).json({ success: false, message: `Listing not found: ${item.listingId}` });
    }

    const price = listing.discountPrice || listing.price;
    const itemTotal = price * item.quantity;

    orderItems.push({
      product: null, // No platform product ID
      listing: listing._id,
      vendor: listing.vendor,
      name: listing.title,
      price,
      quantity: item.quantity,
      designSpecs: item.designSpecs || {}
    });

    subtotal += itemTotal;

    // Aggregate vendor totals for commission calculation
    if (!vendorTotals[listing.vendor]) {
      vendorTotals[listing.vendor] = 0;
    }
    vendorTotals[listing.vendor] += itemTotal;
  }

  const tax = subtotal * 0.15;
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
    estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  // Add timeline event
  await order.addTimelineEvent('pending', 'Marketplace order created');

  // Update listing sales stats
  for (const item of orderItems) {
    await Listing.findByIdAndUpdate(item.listing, {
      $inc: { sales: item.quantity, downloads: item.quantity }
    });

    // Update vendor stats
    await Vendor.findByIdAndUpdate(item.vendor, {
      $inc: {
        'stats.totalSales': item.quantity,
        'stats.totalRevenue': item.price * item.quantity
      }
    });
  }

  // Award points for purchase (addiction engine)
  if (addictionEngine) {
    addictionEngine.rewardAction(req.user.id, 'marketplace_purchase', total);
  }

  // Process payment (this would be handled by payment service)
  // For now, we'll just return success

  res.status(201).json({
    success: true,
    data: order
  });
});

// Get marketplace orders for vendor
exports.getVendorOrders = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const { page = 1, limit = 20, status } = req.query;
  const skip = (page - 1) * limit;
  const filter = { 'items.vendor': vendor._id };
  if (status) filter.orderStatus = status;

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'firstName lastName email')
    .populate('items.listing', 'title');

  const total = await Order.countDocuments(filter);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Fulfill digital download for a purchased item
exports.downloadItem = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const order = await Order.findOne({ _id: orderId, user: req.user.id });
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const item = order.items.id(itemId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }

  const listing = await Listing.findById(item.listing);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Return download links
  const downloadUrls = listing.files.map(f => f.url);
  res.json({
    success: true,
    data: downloadUrls
  });
});
