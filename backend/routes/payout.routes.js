const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const payoutController = require('../controllers/payout.controller');

// Admin only
router.use(authMiddleware.protect, authMiddleware.restrictTo('admin'));

router.get('/history', payoutController.getPayoutHistory);
router.post('/trigger', payoutController.triggerManualPayout);
router.get('/accounts', payoutController.getAccounts);
router.post('/accounts', payoutController.createAccount);
router.put('/accounts/:id', payoutController.updateAccount);
router.delete('/accounts/:id', payoutController.deleteAccount);

module.exports = router;
