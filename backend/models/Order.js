// backend/models/order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' }, // platform product (AI-generated)
    listing: { type: Schema.Types.ObjectId, ref: 'Listing' }, // marketplace listing
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },   // vendor if marketplace
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    designSpecs: { type: Map, of: Schema.Types.Mixed },
    aiCustomizations: [String],
    files: [{ url: String, name: String, type: String }],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: {
    code: String,
    amount: Number,
    type: { type: String, enum: ['percentage', 'fixed'] }
  },
  total: { type: Number, required: true },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'payfast', 'payshap', 'direct-eft', 'bank-transfer', 'crypto'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    amountPaid: Number,
    currency: { type: String, default: 'ZAR' },
    paidAt: Date,
    receiptUrl: String
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'designing', 'review', 'completed', 'cancelled'],
    default: 'pending'
  },
  timeline: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    agent: String
  }],
  notes: String,
  estimatedCompletion: Date,
  // Payout tracking
  payoutProcessed: { type: Boolean, default: false },
  payoutWeek: String, // e.g., '2025-W12'
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Generate order ID before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Method to add timeline event
orderSchema.methods.addTimelineEvent = function(status, message, agent = 'system') {
  this.timeline.push({ status, message, agent });
  return this.save();
};

// Virtual for total items
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

module.exports = mongoose.model('Order', orderSchema);
