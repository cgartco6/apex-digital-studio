const MarketplaceListing = require('../models/MarketplaceListing');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const User = require('../models/User');
const { uploadToCloudinary } = require('../services/cloudinary.service');
const { generateAIDesign } = require('../services/ai.service');
const asyncHandler = require('express-async-handler');

// @desc    Get all marketplace listings
// @route   GET /api/marketplace/listings
// @access  Public
exports.getListings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    sort = '-createdAt',
    search,
    tags,
    seller,
    featured,
    trending,
    aiGenerated
  } = req.query;

  const skip = (page - 1) * limit;

  // Build filter
  const filter = { status: 'active' };
  
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter['pricing.amount'] = {};
    if (minPrice) filter['pricing.amount'].$gte = Number(minPrice);
    if (maxPrice) filter['pricing.amount'].$lte = Number(maxPrice);
  }
  if (tags) filter.tags = { $in: tags.split(',') };
  if (seller) filter.seller = seller;
  if (featured) filter.featured = featured === 'true';
  if (trending) filter.trending = trending === 'true';
  if (aiGenerated) filter.aiGenerated = aiGenerated === 'true';
  
  if (search) {
    filter.$text = { $search: search };
  }

  // Execute query
  const listings = await MarketplaceListing.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('seller', 'firstName lastName avatar marketplaceStats')
    .populate('stats.reviews.user', 'firstName lastName avatar');

  const total = await MarketplaceListing.countDocuments(filter);

  // Get AI recommendations for similar listings
  let recommendations = [];
  if (req.user && listings.length > 0) {
    recommendations = await MarketplaceListing.getAIRecommendations(req.user.id, 6);
  }

  res.status(200).json({
    success: true,
    count: listings.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: listings,
    recommendations
  });
});

// @desc    Get single listing
// @route   GET /api/marketplace/listings/:id
// @access  Public
exports.getListing = asyncHandler(async (req, res) => {
  const listing = await MarketplaceListing.findById(req.params.id)
    .populate('seller', 'firstName lastName avatar marketplaceStats')
    .populate('stats.reviews.user', 'firstName lastName avatar')
    .populate('aiMetadata.similarListings', 'title previewImages pricing stats');

  if (!listing || listing.status !== 'active') {
    return res.status(404).json({
      success: false,
      message: 'Listing not found'
    });
  }

  // Increment view count
  listing.stats.views += 1;
  await listing.save();

  // Get similar listings
  const similarListings = await listing.getSimilarListings();

  res.status(200).json({
    success: true,
    data: listing,
    similarListings
  });
});

// @desc    Create new listing
// @route   POST /api/marketplace/listings
// @access  Private
exports.createListing = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    subcategory,
    tags,
    pricing,
    files,
    attributes,
    delivery,
    requirements
  } = req.body;

  // Check if user can create listing
  const user = await User.findById(req.user.id);
  if (user.marketplaceStats?.seller?.trustLevel === 'banned') {
    return res.status(403).json({
      success: false,
      message: 'Your account is banned from selling'
    });
  }

  // Check daily limit (5 listings per day for new sellers)
  if (user.marketplaceStats?.seller?.trustLevel === 'new') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysListings = await MarketplaceListing.countDocuments({
      seller: req.user.id,
      createdAt: { $gte: today }
    });
    
    if (todaysListings >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Daily listing limit reached. Upgrade to sell more.'
      });
    }
  }

  // Upload files if provided
  let uploadedFiles = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadResult = await uploadToCloudinary(file.path, {
        folder: `marketplace/${req.user.id}`,
        resource_type: 'auto'
      });
      
      uploadedFiles.push({
        url: uploadResult.secure_url,
        name: file.originalname,
        type: file.mimetype.startsWith('image') ? 'preview' : 'source',
        size: file.size,
        format: file.originalname.split('.').pop()
      });
    }
  }

  // Generate AI preview if AI-generated
  let aiMetadata = {};
  if (req.body.aiGenerated === 'true') {
    aiMetadata = {
      qualityScore: 85,
      uniquenessScore: 90,
      trendScore: 75,
      popularityScore: 0
    };
  }

  // Create listing
  const listing = await MarketplaceListing.create({
    title,
    description,
    seller: req.user.id,
    category,
    subcategory,
    tags: tags ? tags.split(',').map(t => t.trim().toLowerCase()) : [],
    aiGenerated: req.body.aiGenerated === 'true',
    aiModel: req.body.aiModel,
    aiPrompt: req.body.aiPrompt,
    files: uploadedFiles,
    previewImages: req.body.previewImages || [],
    pricing: {
      type: pricing?.type || 'fixed',
      amount: pricing?.amount || 0,
      currency: pricing?.currency || 'ZAR',
      discount: pricing?.discount,
      licenseTiers: pricing?.licenseTiers
    },
    attributes,
    delivery: {
      instant: delivery?.instant !== false,
      time: delivery?.time || 0,
      included: delivery?.included || []
    },
