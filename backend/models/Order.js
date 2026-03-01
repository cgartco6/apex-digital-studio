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
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    designSpecs: {
      type: Map,
      of: Schema.Types.Mixed
    },
    aiCustomizations: [{
      type: String
    }],
    revisionsUsed: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'designing', 'review', 'revision', 'completed', 'cancelled'],
      default: 'pending'
    },
    deliveryDate: Date,
    files: [{
      url: String,
      name: String,
      type: String,
      uploadedAt: Date
    }]
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    code: String,
    amount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  total: {
    type: Number,
    required: true
  },
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
    required: true,
    enum: ['stripe', 'paypal', 'payfast', 'payshap', 'direct-eft', 'bank-transfer']
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
    currency: String,
    paidAt: Date,
    receiptUrl: String
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'designing', 'review', 'completed', 'cancelled'],
    default: 'pending'
  },
  aiAssigned: {
    type: Schema.Types.ObjectId,
    ref: 'AIAgent'
  },
  estimatedCompletion: Date,
  notes: String,
  timeline: [{
    status: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    aiAgent: String
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
  timestamps: true
});

// Pre-save middleware to generate order ID
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.orderId = `ORD-${timestamp}-${random}`;
  }
  next();
});

// Method to add timeline event
orderSchema.methods.addTimelineEvent = function(status, message, aiAgent = null) {
  this.timeline.push({
    status,
    message,
    aiAgent
  });
  return this.save();
};

// Method to calculate ETA
orderSchema.methods.calculateETA = function() {
  const avgDaysPerItem = 2;
  const baseDays = this.items.length * avgDaysPerItem;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + baseDays);
  return estimatedDate;
};

// Static method to get dashboard stats
orderSchema.statics.getDashboardStats = async function(ownerId = null) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  const matchStage = ownerId ? { user: ownerId } : {};
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $facet: {
        totalOrders: [
          { $count: 'count' }
        ],
        totalRevenue: [
          { $group: { _id: null, total: { $sum: '$total' } } }
        ],
        monthlyRevenue: [
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ],
        yearlyRevenue: [
          { $match: { createdAt: { $gte: startOfYear } } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ],
        statusCounts: [
          { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ],
        monthlyGrowth: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: { $sum: '$total' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ],
        topProducts: [
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.product',
              count: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
          },
          { $sort: { revenue: -1 } },
          { $limit: 5 }
        ]
      }
    }
  ]);
  
  return stats[0];
};

// Indexes
orderSchema.index({ orderId: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.transactionId': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
