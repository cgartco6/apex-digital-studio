const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  storeName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  storeDescription: {
    type: String,
    required: true
  },
  storeLogo: {
    url: String,
    publicId: String
  },
  storeBanner: {
    url: String,
    publicId: String
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: String,
  website: String,
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  payoutSettings: {
    bankName: String,
    accountName: String,
    accountNumber: String,
    branchCode: String,
    swiftCode: String,
    paypalEmail: String,
    paymentMethod: {
      type: String,
      enum: ['bank', 'paypal', 'payfast'],
      default: 'bank'
    }
  },
  commissionRate: {
    type: Number,
    default: 10, // percentage platform commission on sales
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  stats: {
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now }
  },
  verificationDocuments: [{
    type: String,
    url: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  tags: [String],
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

// Virtual for store URL
vendorSchema.virtual('storeUrl').get(function() {
  return `/marketplace/store/${this.storeName.toLowerCase().replace(/\s+/g, '-')}`;
});

// Indexes
vendorSchema.index({ storeName: 'text', storeDescription: 'text', tags: 'text' });
vendorSchema.index({ status: 1 });
vendorSchema.index({ user: 1 });
vendorSchema.index({ 'stats.averageRating': -1 });

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor;
