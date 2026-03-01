const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

// Get all products
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    sort = '-createdAt',
    search,
    tags,
    aiGenerated
  } = req.query;

  const skip = (page - 1) * limit;

  // Build filter
  const filter = { isActive: true };
  
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (tags) filter.tags = { $in: tags.split(',') };
  if (aiGenerated) filter.aiGenerated = aiGenerated === 'true';
  
  if (search) {
    filter.$text = { $search: search };
  }

  // Execute query
  const products = await Product.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('reviews.user', 'firstName lastName avatar');

  const total = await Product.countDocuments(filter);

  // Get AI recommendations for similar products
  const recommendations = search ? 
    await Product.getAIRecommendations(req.user?.id) : [];

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: products,
    recommendations
  });
});

// Get single product
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('reviews.user', 'firstName lastName avatar');

  if (!product || !product.isActive) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Get similar products using AI
  const similarProducts = await product.getSimilarProducts();

  // Track view (for AI popularity scoring)
  product.aiMetadata.popularityScore += 0.1;
  await product.save();

  res.status(200).json({
    success: true,
    data: product,
    similarProducts
  });
});

// Create product (admin only)
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product
  });
});

// Update product (admin only)
exports.updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: product
  });
});

// Delete product (admin only)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Soft delete
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product deactivated successfully'
  });
});

// Add review
exports.addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.find(
    review => review.user.toString() === req.user.id.toString()
  );

  if (alreadyReviewed) {
    return res.status(400).json({
      success: false,
      message: 'Product already reviewed'
    });
  }

  // Add review
  const review = {
    user: req.user.id,
    rating: Number(rating),
    comment
  };

  product.reviews.push(review);
  product.rating = 
    product.reviews.reduce((acc, item) => item.rating + acc, 0) / 
    product.reviews.length;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Review added successfully'
  });
});

// Get AI recommendations
exports.getAIRecommendations = asyncHandler(async (req, res) => {
  const { userId, context = 'general', limit = 10 } = req.query;

  const recommendations = await Product.getAIRecommendations(
    userId || req.user?.id,
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: recommendations
  });
});

// Get trending products
exports.getTrendingProducts = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  const products = await Product.find({ 
    isActive: true,
    'aiMetadata.trendingScore': { $gt: 70 }
  })
  .sort({ 'aiMetadata.trendingScore': -1 })
  .limit(parseInt(limit))
  .populate('reviews.user', 'firstName lastName avatar');

  res.status(200).json({
    success: true,
    data: products
  });
});

// Bulk update AI metadata (cron job)
exports.updateAIMetadata = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true });

  for (const product of products) {
    // Update trending score based on sales, reviews, and recency
    const daysSinceCreation = Math.floor(
      (new Date() - product.createdAt) / (1000 * 60 * 60 * 24)
    );
    
    const recencyFactor = Math.max(0, 1 - (daysSinceCreation / 365));
    const trendingScore = product.aiMetadata.popularityScore * 0.7 + recencyFactor * 0.3 * 100;
    
    product.aiMetadata.trendingScore = trendingScore;
    product.aiMetadata.lastOptimized = new Date();
    
    await product.save();
  }

  res.status(200).json({
    success: true,
    message: `Updated AI metadata for ${products.length} products`
  });
});
