const mongoose = require('mongoose');

const payoutAccountSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "FNB Main", "African Bank", "AI FNB", "Reserve FNB"
  bank: { type: String, required: true }, // "FNB", "African Bank", etc.
  accountType: { type: String, enum: ['cheque', 'savings', 'business'], default: 'business' },
  accountNumber: { type: String, required: true },
  branchCode: { type: String },
  swiftCode: String,
  iban: String, // for international
  beneficiaryName: { type: String, required: true },
  percentage: { type: Number, required: true, min: 0, max: 100 },
  isActive: { type: Boolean, default: true },
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('PayoutAccount', payoutAccountSchema);
