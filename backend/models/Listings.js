const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'logo-templates',
      'brand-kits',
      'website-templates',
      'social-media-templates',
      'print-templates',
      'ui-kits',
      'icons',
      'fonts',
      'illustrations',
      'stock-photos',
      'video-templates',
      'audio',
      '3d-models',
      'presentations',
      'ebooks',
      'courses',
      'services'
    ]
  },
  subcategory: String,
  tags: [String],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  files: [{
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  previewImages: [{
    url: String,
    publicId: String
  }],
  previewVideo: String,
  previewUrl: String, // for web-based preview
  softwareVersion: String,
  compatibleWith: [String],
  features: [String],
  requirements: String,
  instructions: String,
  license: {
    type: String,
    enum: ['standard', 'extended', 'exclusive'],
    default: 'standard'
  },
  licenseDetails: String,
  downloads: {
    type: Number,
    default: 0
  },
  sales: {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'archived'],
    default: 'draft'
  },
  rejectionReason: String,
  approvedAt: Date,
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiMetadata: {
    prompt: String,
    model: String,
    style: String
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

// Virtual for final price
listingSchema.virtual('finalPrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for discount percentage
listingSchema.virtual('discountPercentage').get(function() {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Indexes
listingSchema.index({ title: 'text', description: 'text', tags: 'text' });
listingSchema.index({ vendor: 1, status: 1 });
listingSchema.index({ category: 1, price: 1 });
listingSchema.index({ rating: -1, sales: -1 });
listingSchema.index({ featured: -1 });
listingSchema.index({ createdAt: -1 });

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
