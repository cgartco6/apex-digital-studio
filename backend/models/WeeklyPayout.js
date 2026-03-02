const mongoose = require('mongoose');

const weeklyPayoutSchema = new mongoose.Schema({
  week: { type: String, required: true, unique: true }, // format: 'YYYY-Www' e.g., '2025-W12'
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalRevenue: { type: Number, required: true },
  allocations: [{
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'PayoutAccount' },
    amount: Number,
    percentage: Number,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    transactionId: String,
    errorMessage: String
  }],
  retainedAmount: { type: Number, required: true }, // 10% retained in platform
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  processedAt: Date,
  completedAt: Date,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // system or admin
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyPayout', weeklyPayoutSchema);
