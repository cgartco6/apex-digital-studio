const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const marketplaceListingSchema = new Schema({
  listingId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Listing title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'logos',
      'brand-identity',
      'web-templates',
      'social-media',
      'print-design',
      'ui-kits',
      'illustrations',
      'fonts',
      'templates',
      '3d-models',
      'motion-graphics',
      'stock-photos'
    ]
  },
  subcategory: {
    type: String
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  aiGenerated: {
    type: Boolean,
    default: true
  },
  aiModel: {
    type: String,
    enum: ['dalle-3', 'stable-diffusion', 'midjourney', 'custom', 'apex-ai']
  },
  aiPrompt: String,
  files: [{
    url: String,
    name: String,
    type: String, // source, preview, thumbnail
    size: Number,
    format: String, // ai, psd, figma, svg, png, jpg
    resolution: String,
    license: {
      type: String,
      enum: ['personal', 'commercial', 'extended', 'exclusive'],
      default: 'commercial'
    }
  }],
  previewImages: [{
    url: String,
    publicId: String,
    isPrimary: Boolean
  }],
  pricing: {
    type: {
      type: String,
      enum: ['fixed', 'auction', 'subscription', 'bundle'],
      default: 'fixed'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'ZAR'
    },
    discount: {
      percentage: Number,
      expires: Date
    },
    licenseTiers: [{
      type: String,
      amount: Number,
      features: [String]
    }]
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
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
    }]
  },
  attributes: {
    compatibleWith: [String], // Photoshop, Figma, etc.
    fileFormats: [String],
    dimensions: String,
    colors: [String],
    customizable: Boolean,
    responsive: Boolean,
    layered: Boolean,
    licenseIncluded: Boolean,
    supportIncluded: Boolean,
    updatesIncluded: Boolean
  },
  delivery: {
    instant: {
      type: Boolean,
      default: true
    },
    time: {
      type: Number, // hours
      default: 0
    },
    included: [String] // source files, documentation, etc.
  },
  requirements: {
    software: [String],
    skills: [String],
    license: String
  },
  aiMetadata: {
    qualityScore: Number,
    uniquenessScore: Number,
    trendScore: Number,
    popularityScore: Number,
    similarListings: [{
      type: Schema.Types.ObjectId,
      ref: 'MarketplaceListing'
    }],
    recommendations: [{
      type: Schema.Types.ObjectId,
      ref: 'MarketplaceListing'
    }],
    lastOptimized: Date
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'sold', 'paused', 'rejected'],
    default: 'draft'
  },
  moderation: {
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    notes: String,
    violations: [String]
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
marketplaceListingSchema.virtual('isActive').get(function() {
  return this.status === 'active' && new Date() < this.expiresAt;
});

marketplaceListingSchema.virtual('discountPrice').get(function() {
  if (this.pricing.discount && this.pricing.discount.percentage && 
      (!this.pricing.discount.expires || new Date() < this.pricing.discount.expires)) {
    return this.pricing.amount * (1 - this.pricing.discount.percentage / 100);
  }
  return this.pricing.amount;
});

marketplaceListingSchema.virtual('sellerRating').get(async function() {
  const seller = await mongoose.model('User').findById(this.seller);
  return seller?.marketplaceStats?.rating || 0;
});

// Indexes
marketplaceListingSchema.index({ title: 'text', description: 'text', tags: 'text' });
marketplaceListingSchema.index({ category: 1, 'pricing.amount': 1 });
marketplaceListingSchema.index({ seller: 1, status: 1 });
marketplaceListingSchema.index({ 'aiMetadata.trendScore': -1 });
marketplaceListingSchema.index({ 'stats.sales': -1 });
marketplaceListingSchema.index({ featured: 1, trending: 1 });
marketplaceListingSchema.index({ createdAt: -1 });
marketplaceListingSchema.index({ expiresAt: 1 });

// Pre-save middleware
marketplaceListingSchema.pre('save', async function(next) {
  if (!this.listingId) {
    this.listingId = `LIST-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Calculate AI metadata
  if (this.isModified('stats') || this.isModified('tags')) {
    this.aiMetadata.popularityScore = this.calculatePopularityScore();
    this.aiMetadata.trendScore = this.calculateTrendScore();
    this.aiMetadata.lastOptimized = new Date();
  }
  
  // Auto-approve for trusted sellers
  if (this.status === 'pending') {
    const seller = await mongoose.model('User').findById(this.seller);
    if (seller?.marketplaceStats?.trustLevel === 'trusted') {
      this.status = 'active';
      this.moderation.reviewedBy = null; // Auto-approved by system
      this.moderation.reviewedAt = new Date();
    }
  }
  
  next();
});

// Methods
marketplaceListingSchema.methods.calculatePopularityScore = function() {
  const viewsWeight = 0.3;
  const likesWeight = 0.2;
  const salesWeight = 0.4;
  const ratingWeight = 0.1;
  
  const normalizedViews = Math.min(this.stats.views / 1000, 1);
  const normalizedLikes = Math.min(this.stats.likes / 100, 1);
  const normalizedSales = Math.min(this.stats.sales / 50, 1);
  const normalizedRating = this.stats.rating / 5;
  
  return (normalizedViews * viewsWeight + 
          normalizedLikes * likesWeight + 
          normalizedSales * salesWeight + 
          normalizedRating * ratingWeight) * 100;
};

marketplaceListingSchema.methods.calculateTrendScore = function() {
  const daysOld = (new Date() - this.createdAt) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0, 1 - (daysOld / 30));
  const velocity = this.stats.sales / Math.max(1, daysOld);
  
  return (this.aiMetadata.popularityScore * 0.6 + 
          recencyFactor * 0.2 + 
          Math.min(velocity * 10, 1) * 0.2);
};

marketplaceListingSchema.methods.getSimilarListings = async function(limit = 8) {
  return this.model('MarketplaceListing').find({
    category: this.category,
    _id: { $ne: this._id },
    status: 'active',
    'aiMetadata.qualityScore': { $gt: 70 }
  })
  .sort({ 'aiMetadata.trendScore': -1 })
  .limit(limit)
  .populate('seller', 'firstName lastName avatar marketplaceStats');
};

marketplaceListingSchema.methods.generateAIPreview = async function() {
  // This would call AI to generate additional previews
  return {
    mockups: [],
    colorVariations: [],
    styleVariations: []
  };
};

// Static methods
marketplaceListingSchema.statics.getTrendingListings = async function(limit = 12) {
  return this.find({
    status: 'active',
    'aiMetadata.trendScore': { $gt: 75 }
  })
  .sort({ 'aiMetadata.trendScore': -1 })
  .limit(limit)
  .populate('seller', 'firstName lastName avatar marketplaceStats');
};

marketplaceListingSchema.statics.getAIRecommendations = async function(userId, limit = 12) {
  const user = await mongoose.model('User').findById(userId);
  
  // Based on user preferences, purchase history, browsing history
  return this.find({
    status: 'active',
    'aiMetadata.qualityScore': { $gt: 80 }
  })
  .sort({ 'aiMetadata.popularityScore': -1 })
  .limit(limit)
  .populate('seller', 'firstName lastName avatar marketplaceStats');
};

marketplaceListingSchema.statics.bulkAIQualityCheck = async function() {
  const listings = await this.find({ status: 'active' });
  
  for (const listing of listings) {
    // AI would analyze design quality here
    listing.aiMetadata.qualityScore = Math.floor(Math.random() * 30) + 70; // Mock 70-100
    listing.aiMetadata.uniquenessScore = Math.floor(Math.random() * 40) + 60;
    await listing.save();
  }
  
  return listings.length;
};

const MarketplaceListing = mongoose.model('MarketplaceListing', marketplaceListingSchema);

module.exports = MarketplaceListing;
