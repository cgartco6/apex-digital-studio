const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'logo-design',
      'brand-identity',
      'web-design',
      'social-media',
      'packaging',
      'print-design',
      'ui-ux',
      'motion-graphics',
      'ai-templates',
      'custom-design'
    ]
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  images: [{
    url: String,
    publicId: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiModel: {
    type: String,
    enum: ['dalle-3', 'stable-diffusion', 'midjourney', 'custom']
  },
  aiPrompt: String,
  features: [{
    title: String,
    description: String,
    icon: String
  }],
  deliveryTime: {
    type: Number,
    required: true,
    default: 3
  },
  revisions: {
    type: Number,
    default: 3
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviews: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  salesCount: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  aiMetadata: {
    designStyle: String,
    colorPalette: [String],
    trendingScore: Number,
    popularityScore: Number,
    lastOptimized: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discounted price
productSchema.virtual('finalPrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Indexes for faster queries
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ 'aiMetadata.trendingScore': -1 });
productSchema.index({ rating: -1, salesCount: -1 });

// Pre-save middleware to update AI metadata
productSchema.pre('save', function(next) {
  if (this.isModified('salesCount') || this.isModified('reviews')) {
    this.aiMetadata.popularityScore = this.calculatePopularityScore();
    this.aiMetadata.lastOptimized = new Date();
  }
  next();
});

// Method to calculate popularity score
productSchema.methods.calculatePopularityScore = function() {
  const salesWeight = 0.6;
  const ratingWeight = 0.3;
  const reviewWeight = 0.1;
  
  const normalizedSales = Math.min(this.salesCount / 100, 1);
  const normalizedRating = this.rating / 5;
  const normalizedReviews = Math.min(this.reviews.length / 50, 1);
  
  return (normalizedSales * salesWeight + 
          normalizedRating * ratingWeight + 
          normalizedReviews * reviewWeight) * 100;
};

// Method to get similar products
productSchema.methods.getSimilarProducts = async function(limit = 4) {
  return this.model('Product').find({
    category: this.category,
    _id: { $ne: this._id },
    isActive: true
  })
  .sort({ 'aiMetadata.trendingScore': -1 })
  .limit(limit);
};

// Static method for AI recommendations
productSchema.statics.getAIRecommendations = async function(userId, limit = 10) {
  // In production, this would use a proper recommendation engine
  return this.find({
    isActive: true,
    'aiMetadata.trendingScore': { $gt: 70 }
  })
  .sort({ 'aiMetadata.trendingScore': -1 })
  .limit(limit);
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
