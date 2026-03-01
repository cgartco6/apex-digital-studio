const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['client', 'designer', 'admin', 'agent'],
    default: 'client'
  },
  avatar: {
    url: String,
    publicId: String
  },
  company: {
    name: String,
    website: String,
    industry: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    phone: String
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  preferences: {
    designStyle: String,
    colorPalette: [String],
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    }
  },
  stats: {
    totalSpent: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalProjects: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now }
  },
  aiCredits: {
    free: { type: Number, default: 10 },
    purchased: { type: Number, default: 0 },
    used: { type: Number, default: 0 }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'trial'],
      default: 'trial'
    },
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }],
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { userId: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Generate verification token
userSchema.methods.createVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for available credits
userSchema.virtual('availableCredits').get(function() {
  return this.aiCredits.free + this.aiCredits.purchased - this.aiCredits.used;
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
// Add to User schema
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  
  marketplaceStats: {
    seller: {
      listings: {
        total: { type: Number, default: 0 },
        active: { type: Number, default: 0 },
        sold: { type: Number, default: 0 }
      },
      earnings: {
        total: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        available: { type: Number, default: 0 }
      },
      rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
        breakdown: {
          1: { type: Number, default: 0 },
          2: { type: Number, default: 0 },
          3: { type: Number, default: 0 },
          4: { type: Number, default: 0 },
          5: { type: Number, default: 0 }
        }
      },
      trustLevel: {
        type: String,
        enum: ['new', 'verified', 'trusted', 'featured', 'power'],
        default: 'new'
      },
      badges: [{
        type: String,
        enum: [
          'top_seller',
          'fast_delivery',
          'great_support',
          'quality_designer',
          'ai_expert',
          'trend_setter',
          'community_leader'
        ]
      }]
    },
    buyer: {
      purchases: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      favoriteCategories: [String],
      wishlist: [{
        type: Schema.Types.ObjectId,
        ref: 'MarketplaceListing'
      }]
    },
    affiliate: {
      code: String,
      referrals: { type: Number, default: 0 },
      earnings: { type: Number, default: 0 },
      converted: { type: Number, default: 0 }
    }
  },
  
  wallet: {
    balance: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    currency: { type: String, default: 'ZAR' },
    transactions: [{
      type: {
        type: String,
        enum: ['sale', 'purchase', 'withdrawal', 'deposit', 'refund', 'commission']
      },
      amount: Number,
      description: String,
      reference: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // ... rest of schema ...
});

// Add method to update seller rating
userSchema.methods.updateSellerRating = async function() {
  const Order = mongoose.model('MarketplaceOrder');
  
  const stats = await Order.aggregate([
    { $match: { seller: this._id, 'review.rating': { $exists: true } } },
    {
      $group: {
        _id: null,
        average: { $avg: '$review.rating' },
        count: { $sum: 1 },
        breakdown: {
          $push: '$review.rating'
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].breakdown.forEach(rating => {
      const key = Math.round(rating);
      if (breakdown[key] !== undefined) {
        breakdown[key]++;
      }
    });
    
    this.marketplaceStats.seller.rating = {
      average: stats[0].average,
      count: stats[0].count,
      breakdown
    };
    
    // Update trust level based on rating and sales
    const totalSales = this.marketplaceStats.seller.listings.sold;
    if (totalSales >= 100 && stats[0].average >= 4.8) {
      this.marketplaceStats.seller.trustLevel = 'power';
    } else if (totalSales >= 50 && stats[0].average >= 4.5) {
      this.marketplaceStats.seller.trustLevel = 'featured';
    } else if (totalSales >= 20 && stats[0].average >= 4.0) {
      this.marketplaceStats.seller.trustLevel = 'trusted';
    } else if (totalSales >= 5) {
      this.marketplaceStats.seller.trustLevel = 'verified';
    }
    
    await this.save();
  }
};

// Add method to withdraw earnings
userSchema.methods.withdrawEarnings = async function(amount, method, details) {
  if (amount > this.marketplaceStats.seller.earnings.available) {
    throw new Error('Insufficient available earnings');
  }
  
  this.wallet.balance -= amount;
  this.marketplaceStats.seller.earnings.available -= amount;
  
  this.wallet.transactions.push({
    type: 'withdrawal',
    amount: -amount,
    description: `Withdrawal via ${method}`,
    reference: `WD-${Date.now()}`,
    status: 'pending',
    metadata: details
  });
  
  await this.save();
  
  // Process withdrawal (this would integrate with payment provider)
  // For now, auto-complete after 1 minute
  setTimeout(async () => {
    const transaction = this.wallet.transactions[this.wallet.transactions.length - 1];
    transaction.status = 'completed';
    await this.save();
  }, 60000);
  
  return this.wallet.transactions[this.wallet.transactions.length - 1];
};
