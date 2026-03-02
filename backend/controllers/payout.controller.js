const PayoutAccount = require('../models/PayoutAccount');
const payoutEngine = require('../services/payoutEngine');
const asyncHandler = require('express-async-handler');

exports.getPayoutHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const history = await payoutEngine.getPayoutHistory(page, limit);
  res.json({ success: true, data: history });
});

exports.triggerManualPayout = asyncHandler(async (req, res) => {
  const { week } = req.body;
  await payoutEngine.triggerManualPayout(week);
  res.json({ success: true, message: 'Payout triggered' });
});

exports.getAccounts = asyncHandler(async (req, res) => {
  const accounts = await PayoutAccount.find();
  res.json({ success: true, data: accounts });
});

exports.createAccount = asyncHandler(async (req, res) => {
  const account = await PayoutAccount.create(req.body);
  res.status(201).json({ success: true, data: account });
});

exports.updateAccount = asyncHandler(async (req, res) => {
  const account = await PayoutAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: account });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  await PayoutAccount.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});
