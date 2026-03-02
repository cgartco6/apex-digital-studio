const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  netAmount: {
    type: Number,
    required: true
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bank', 'paypal', 'payfast'],
    required: true
  },
  transactionId: String,
  paymentDetails: mongoose.Schema.Types.Mixed,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,
  notes: String
}, {
  timestamps: true
});

payoutSchema.index({ vendor: 1, status: 1 });
payoutSchema.index({ requestedAt: -1 });

const VendorPayout = mongoose.model('VendorPayout', payoutSchema);
module.exports = VendorPayout;
