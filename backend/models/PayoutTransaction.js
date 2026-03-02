const mongoose = require('mongoose');

const payoutTransactionSchema = new mongoose.Schema({
  weeklyPayout: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyPayout', required: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'PayoutAccount', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'ZAR' },
  reference: String,
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  bankReference: String,
  transactionId: String, // from bank API
  errorMessage: String,
  initiatedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PayoutTransaction', payoutTransactionSchema);
