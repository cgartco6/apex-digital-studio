const Listing = require('../../models/Listing');
const Vendor = require('../../models/Vendor');
const asyncHandler = require('express-async-handler');
const { uploadFile } = require('../../services/storage.service');

// Create listing
exports.createListing = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor || vendor.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Active vendor account required' });
  }

  const {
    title, description, category, subcategory, tags, price, discountPrice,
    features, requirements, instructions, license, licenseDetails,
    softwareVersion, compatibleWith, previewUrl, aiGenerated, aiMetadata
  } = req.body;

  // Handle file uploads
  let files = [];
  let previewImages = [];

  if (req.files) {
    if (req.files.files) {
      for (const file of req.files.files) {
        const uploaded = await uploadFile(file);
        files.push({
          name: file.originalname,
          url: uploaded.url,
          size: file.size,
          type: file.mimetype
        });
      }
    }
    if (req.files.images) {
      for (const img of req.files.images) {
        const uploaded = await uploadFile(img);
        previewImages.push({ url: uploaded.url, publicId: uploaded.publicId });
      }
    }
  }

  const listing = await Listing.create({
    vendor: vendor._id,
    title,
    description,
    category,
    subcategory,
    tags: tags ? tags.split(',') : [],
    price,
    discountPrice,
    files,
    previewImages,
    previewUrl,
    softwareVersion,
    compatibleWith: compatibleWith ? compatibleWith.split(',') : [],
    features: features ? features.split('\n') : [],
    requirements,
    instructions,
    license,
    licenseDetails,
    status: 'pending',
    aiGenerated: aiGenerated === 'true',
    aiMetadata: aiMetadata ? JSON.parse(aiMetadata) : {}
  });

  // Increment vendor total products
  vendor.stats.totalProducts += 1;
  await vendor.save();

  res.status(201).json({
    success: true,
    data: listing
  });
});

// Get vendor's listings
exports.getMyListings = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const { page = 1, limit = 20, status } = req.query;
  const skip = (page - 1) * limit;
  const filter = { vendor: vendor._id };
  if (status) filter.status = status;

  const listings = await Listing.find(filter)
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Listing.countDocuments(filter);

  res.json({
    success: true,
    data: listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Update listing
exports.updateListing = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const listing = await Listing.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  const allowedUpdates = [
    'title', 'description', 'category', 'subcategory', 'tags', 'price', 'discountPrice',
    'features', 'requirements', 'instructions', 'license', 'licenseDetails',
    'softwareVersion', 'compatibleWith', 'previewUrl'
  ];
  const updates = {};
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  // Handle new files (may need to manage existing files)
  if (req.files) {
    if (req.files.files) {
      const newFiles = [];
      for (const file of req.files.files) {
        const uploaded = await uploadFile(file);
        newFiles.push({
          name: file.originalname,
          url: uploaded.url,
          size: file.size,
          type: file.mimetype
        });
      }
      updates.files = [...(listing.files || []), ...newFiles];
    }
    if (req.files.images) {
      const newImages = [];
      for (const img of req.files.images) {
        const uploaded = await uploadFile(img);
        newImages.push({ url: uploaded.url, publicId: uploaded.publicId });
      }
      updates.previewImages = [...(listing.previewImages || []), ...newImages];
    }
  }

  // Reset status to pending if changes made
  updates.status = 'pending';

  const updatedListing = await Listing.findByIdAndUpdate(listing._id, updates, { new: true });

  res.json({
    success: true,
    data: updatedListing
  });
});

// Delete listing (soft delete or archive)
exports.deleteListing = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ user: req.user.id });
  if (!vendor) {
    return res.status(404).json({ success: false, message: 'Vendor not found' });
  }

  const listing = await Listing.findOne({ _id: req.params.id, vendor: vendor._id });
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  listing.isActive = false;
  listing.status = 'archived';
  await listing.save();

  // Decrement vendor total products
  vendor.stats.totalProducts -= 1;
  await vendor.save();

  res.json({
    success: true,
    message: 'Listing archived'
  });
});

// Get public listing by ID
exports.getListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({ _id: req.params.id, status: 'approved', isActive: true })
    .populate('vendor', 'storeName storeLogo isVerified stats.averageRating stats.totalReviews');

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Increment view count (optional)
  listing.downloads += 0; // placeholder for views if needed

  res.json({
    success: true,
    data: listing
  });
});

// Search/filter listings (public)
exports.searchListings = asyncHandler(async (req, res) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    license,
    sort = '-createdAt',
    page = 1,
    limit = 20,
    vendor,
    tags,
    minRating
  } = req.query;

  const skip = (page - 1) * limit;
  const filter = { status: 'approved', isActive: true };

  if (q) {
    filter.$text = { $search: q };
  }
  if (category) {
    filter.category = category;
  }
  if (vendor) {
    filter.vendor = vendor;
  }
  if (tags) {
    filter.tags = { $in: tags.split(',') };
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (license) {
    filter.license = license;
  }
  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }

  const listings = await Listing.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('vendor', 'storeName storeLogo isVerified');

  const total = await Listing.countDocuments(filter);

  res.json({
    success: true,
    data: listings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Add review to listing
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  // Check if user already reviewed
  const alreadyReviewed = listing.reviews.find(
    r => r.user.toString() === req.user.id.toString()
  );
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: 'Already reviewed' });
  }

  const review = {
    user: req.user.id,
    rating: Number(rating),
    comment
  };

  listing.reviews.push(review);
  listing.rating = listing.reviews.reduce((acc, r) => acc + r.rating, 0) / listing.reviews.length;
  await listing.save();

  // Update vendor stats (average rating and review count)
  const vendor = await Vendor.findById(listing.vendor);
  vendor.stats.totalReviews += 1;
  vendor.stats.averageRating = (vendor.stats.averageRating * (vendor.stats.totalReviews - 1) + rating) / vendor.stats.totalReviews;
  await vendor.save();

  res.status(201).json({
    success: true,
    data: review
  });
});

// Admin: approve/reject listing
exports.updateListingStatus = asyncHandler(async (req, res) => {
  const { listingId } = req.params;
  const { status, rejectionReason } = req.body;

  const listing = await Listing.findById(listingId);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  listing.status = status;
  if (status === 'approved') {
    listing.approvedAt = new Date();
    listing.isActive = true;
  } else if (status === 'rejected') {
    listing.rejectionReason = rejectionReason;
    listing.isActive = false;
  }
  await listing.save();

  res.json({
    success: true,
    data: listing
  });
});
