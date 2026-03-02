const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  icon: String,
  image: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceCategory',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for children
categorySchema.virtual('children', {
  ref: 'MarketplaceCategory',
  localField: '_id',
  foreignField: 'parent'
});

const MarketplaceCategory = mongoose.model('MarketplaceCategory', categorySchema);
module.exports = MarketplaceCategory;
