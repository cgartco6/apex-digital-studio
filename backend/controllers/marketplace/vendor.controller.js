const Vendor = require('../../models/Vendor');
const User = require('../../models/User');
const asyncHandler = require('express-async-handler');
const { uploadFile } = require('../../services/storage.service');

// Register as vendor
exports.registerVendor = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { storeName, storeDescription, contactEmail, contactPhone, website, socialLinks, address, payoutSettings, tags } = req.body;

  // Check if user already has vendor profile
  const existingVendor = await Vendor.findOne({ user: userId });
  if (existingVendor) {
    return res.status(400).json({
      success: false,
      message: 'You already have a vendor profile'
    });
  }

  // Check if store name is taken
  const nameExists = await Vendor.findOne({ storeName });
  if (nameExists) {
    return res.status(400).json({
      success: false,
      message: 'Store name already exists'
    });
  }

  // Handle file uploads if any
  let storeLogo = {};
  let storeBanner = {};
  if (req.files) {
    if (req.files.logo) {
      const logo = await uploadFile(req.files.logo[0]);
      storeLogo = { url: logo.url, publicId: logo.publicId };
    }
    if (req.files.banner) {
      const banner = await uploadFile(req.files.banner[0]);
      storeBanner = { url: banner.url, publicId: banner.publicId };
    }
  }

  const vendor = await Vendor.create({
    user: userId,
    storeName,
    storeDescription,
    storeLogo,
    storeBanner,
    contactEmail,
    contactPhone,
    website,
    socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
    address: address ? JSON.parse(address) : {},
    payoutSettings: payoutSettings ? JSON.parse(payoutSettings) : {},
    tags: tags ? tags.split(',') : [],
    status: 'pending',
    stats: {
      joinedAt: new Date()
    }
  });

  // Update user role to vendor
  await User.findByIdAndUpdate(userId, { role: 'vendor' });

  res.status(201).json({
    success: true,
    data: vendor
  });
});

// Get vendor profile
exports.getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id }).populate('user', 'firstName lastName email avatar');
  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: 'Vendor profile not found'
    });
  }
  res.json({
    success: true,
    data: vendor
  });
});

// Get public vendor profile by store name or ID
exports.getPublicVendor = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  let vendor;
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    vendor = await Vendor.findById(identifier).populate('user', 'firstName lastName avatar');
  } else {
    vendor = await Vendor.findOne({ storeName: identifier }).populate('user', 'firstName lastName avatar');
  }
  if (!vendor || vendor.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Vendor not found'
    });
  }
  // Return public info only
  const publicVendor = {
    _id: vendor._id,
    storeName: vendor.storeName,
    storeDescription: vendor.storeDescription,
    storeLogo: vendor.storeLogo,
    storeBanner: vendor.storeBanner,
    website: vendor.website,
    socialLinks: vendor.socialLinks,
    stats: {
      totalProducts: vendor.stats.totalProducts,
      averageRating: vendor.stats.averageRating,
      totalReviews: vendor.stats.totalReviews,
      joinedAt: vendor.stats.joinedAt
    },
    isVerified: vendor.isVerified,
    tags: vendor.tags
  };
  res.json({
    success: true,
    data: publicVendor
  });
});

// Update vendor profile
exports.updateVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const allowedUpdates = ['storeName', 'storeDescription', 'contactEmail', 'contactPhone', 'website', 'socialLinks', 'address', 'tags'];
  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // Handle file uploads
  if (req.files) {
    if (req.files.logo) {
      const logo = await uploadFile(req.files.logo[0]);
      updates.storeLogo = { url: logo.url, publicId: logo.publicId };
    }
    if (req.files.banner) {
      const banner = await uploadFile(req.files.banner[0]);
      updates.storeBanner = { url: banner.url, publicId: banner.publicId };
    }
  }

  const updatedVendor = await Vendor.findByIdAndUpdate(vendor._id, updates, { new: true });

  res.json({
    success: true,
    data: updatedVendor
  });
});

// Update payout settings
exports.updatePayoutSettings = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const { payoutSettings } = req.body;
  vendor.payoutSettings = { ...vendor.payoutSettings, ...payoutSettings };
  await vendor.save();

  res.json({
    success: true,
    data: vendor.payoutSettings
  });
});

// Get vendor dashboard stats
exports.getVendorStats = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const listings = await Listing.find({ vendor: vendor._id, status: 'approved' });
  const totalListings = listings.length;
  const totalSales = vendor.stats.totalSales;
  const totalRevenue = vendor.stats.totalRevenue;
  const pendingOrders = await Order.countDocuments({ 'items.vendor': vendor._id, orderStatus: 'pending' });
  const recentOrders = await Order.find({ 'items.vendor': vendor._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'firstName lastName email');

  const stats = {
    totalListings,
    totalSales,
    totalRevenue,
    pendingOrders,
    averageRating: vendor.stats.averageRating,
    recentOrders
  };

  res.json({
    success: true,
    data: stats
  });
});

// Admin: get all vendors (admin only)
exports.getAllVendors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const skip = (page - 1) * limit;
  const filter = {};
  if (status) filter.status = status;

  const vendors = await Vendor.find(filter)
    .populate('user', 'firstName lastName email')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Vendor.countDocuments(filter);

  res.json({
    success: true,
    data: vendors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Admin: approve/reject vendor
exports.updateVendorStatus = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;
  const { status, rejectionReason } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  vendor.status = status;
  if (status === 'rejected' && rejectionReason) {
    vendor.rejectionReason = rejectionReason;
  }
  if (status === 'active') {
    vendor.isVerified = true;
  }
  await vendor.save();

  // If approved, update user role to vendor (if not already)
  if (status === 'active') {
    await User.findByIdAndUpdate(vendor.user, { role: 'vendor' });
  }

  res.json({
    success: true,
    data: vendor
  });
});
