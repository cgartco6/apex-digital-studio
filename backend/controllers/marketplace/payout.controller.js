const VendorPayout = require('../../models/VendorPayout');
const Vendor = require('../../models/Vendor');
const Order = require('../../models/Order');
const asyncHandler = require('express-async-handler');

// Request payout
exports.requestPayout = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor || vendor.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Active vendor required' });
  }

  // Check if there's pending payout
  const pending = await VendorPayout.findOne({ vendor: vendor._id, status: 'pending' });
  if (pending) {
    return res.status(400).json({ success: false, message: 'You already have a pending payout request' });
  }

  // Calculate available balance: totalRevenue minus sum of payouts (completed + pending)
  const payouts = await VendorPayout.find({ vendor: vendor._id, status: { $in: ['completed', 'pending'] } });
  const paidOut = payouts.reduce((sum, p) => sum + p.netAmount, 0);
  const available = vendor.stats.totalRevenue - paidOut;

  if (available <= 0) {
    return res.status(400).json({ success: false, message: 'No funds available for payout' });
  }

  // Allow requesting specific amount up to available
  const requestedAmount = req.body.amount ? Math.min(req.body.amount, available) : available;

  // Calculate platform commission (if any) - but vendor stats should already be net of commission
  // We'll assume stats.totalRevenue is net after commission, so no further deduction

  const payout = await VendorPayout.create({
    vendor: vendor._id,
    amount: requestedAmount,
    commission: 0, // no commission deducted here, already in stats
    netAmount: requestedAmount,
    status: 'pending',
    paymentMethod: vendor.payoutSettings.paymentMethod,
    requestedAt: new Date()
  });

  res.status(201).json({
    success: true,
    data: payout
  });
});

// Get payout history for vendor
exports.getPayoutHistory = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

  const payouts = await VendorPayout.find({ vendor: vendor._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    data: payouts
  });
});

// Admin: get all payout requests
exports.getAllPayouts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;

  const payouts = await VendorPayout.find(filter)
    .populate('vendor', 'storeName user')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ requestedAt: -1 });

  const total = await VendorPayout.countDocuments(filter);

  res.json({
    success: true,
    data: payouts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Admin: process payout
exports.processPayout = asyncHandler(async (req, res) => {
  const { payoutId } = req.params;
  const { status, transactionId, notes } = req.body;

  const payout = await VendorPayout.findById(payoutId).populate('vendor');
  if (!payout) {
    return res.status(404).json({ success: false, message: 'Payout not found' });
  }

  payout.status = status;
  payout.processedAt = new Date();
  if (transactionId) payout.transactionId = transactionId;
  if (notes) payout.notes = notes;
  await payout.save();

  res.json({
    success: true,
    data: payout
  });
});
