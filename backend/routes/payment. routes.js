const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth');

// Payment routes
router.post('/create-intent', authMiddleware.protect, paymentController.createPaymentIntent);
router.post('/confirm', authMiddleware.protect, paymentController.confirmPayment);
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);
router.post('/webhook/payfast', paymentController.payfastWebhook);
router.post('/webhook/paypal', paymentController.paypalWebhook);

// South African payment methods
router.post('/payfast/create', authMiddleware.protect, paymentController.createPayfastPayment);
router.post('/payshap/initiate', authMiddleware.protect, paymentController.initiatePayShap);
router.post('/direct-eft/initiate', authMiddleware.protect, paymentController.initiateDirectEFT);

// Refunds and cancellations
router.post('/refund', authMiddleware.protect, authMiddleware.restrictTo('admin'), paymentController.processRefund);
router.get('/history', authMiddleware.protect, paymentController.getPaymentHistory);

module.exports = router;
