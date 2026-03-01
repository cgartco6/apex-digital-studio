const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const payfast = require('payfast-node')({
  merchant_id: process.env.PAYFAST_MERCHANT_ID,
  merchant_key: process.env.PAYFAST_MERCHANT_KEY,
  passphrase: process.env.PAYFAST_PASSPHRASE,
  testMode: process.env.NODE_ENV !== 'production'
});
const axios = require('axios');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const asyncHandler = require('express-async-handler');

// Create Stripe payment intent
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { amount, currency = 'zar', orderId, metadata } = req.body;
  
  if (!amount || !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Amount and order ID are required'
    });
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        userId: req.user._id.toString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      order: orderId,
      amount,
      currency,
      paymentMethod: 'stripe',
      status: 'pending',
      gatewayData: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// Confirm payment
exports.confirmPayment = asyncHandler(async (req, res) => {
  const { paymentId, paymentIntentId } = req.body;

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment status
      payment.status = 'completed';
      payment.gatewayData.transactionId = paymentIntent.id;
      payment.gatewayData.receiptUrl = paymentIntent.charges.data[0].receipt_url;
      payment.paidAt = new Date();
      await payment.save();

      // Update order status
      await Order.findOneAndUpdate(
        { orderId: payment.order },
        {
          paymentStatus: 'completed',
          orderStatus: 'confirmed',
          'paymentDetails.transactionId': paymentIntent.id,
          'paymentDetails.paidAt': new Date(),
          'paymentDetails.receiptUrl': paymentIntent.charges.data[0].receipt_url
        }
      );

      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Payment status: ${paymentIntent.status}`
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

// PayFast payment creation
exports.createPayfastPayment = asyncHandler(async (req, res) => {
  const { amount, orderId, returnUrl, cancelUrl, notifyUrl } = req.body;

  const paymentData = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,
    return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
    notify_url: notifyUrl || `${process.env.BACKEND_URL}/api/payments/webhook/payfast`,
    name_first: req.user.firstName,
    name_last: req.user.lastName,
    email_address: req.user.email,
    m_payment_id: orderId,
    amount: amount.toString(),
    item_name: `Order ${orderId}`,
    item_description: 'Digital Design Services'
  };

  // Generate signature
  const signature = payfast.generateSignature(paymentData);
  paymentData.signature = signature;

  // Create payment record
  const payment = await Payment.create({
    user: req.user._id,
    order: orderId,
    amount,
    currency: 'ZAR',
    paymentMethod: 'payfast',
    status: 'pending',
    gatewayData: paymentData
  });

  // Redirect to PayFast
  const payfastUrl = process.env.NODE_ENV === 'production'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';

  res.status(200).json({
    success: true,
    paymentUrl: payfastUrl,
    paymentData,
    paymentId: payment._id
  });
});

// PayShap payment initiation
exports.initiatePayShap = asyncHandler(async (req, res) => {
  const { amount, orderId, bankCode } = req.body;

  // In a real implementation, this would integrate with PayShap API
  // This is a mock implementation

  const payment = await Payment.create({
    user: req.user._id,
    order: orderId,
    amount,
    currency: 'ZAR',
    paymentMethod: 'payshap',
    status: 'pending',
    gatewayData: {
      bankCode,
      reference: `PSHAP-${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    }
  });

  res.status(200).json({
    success: true,
    message: 'PayShap payment initiated',
    paymentId: payment._id,
    reference: payment.gatewayData.reference,
    instructions: `Please complete the payment using your banking app with reference: ${payment.gatewayData.reference}`
  });
});

// Direct EFT payment
exports.initiateDirectEFT = asyncHandler(async (req, res) => {
  const { amount, orderId, bankName } = req.body;

  // Generate reference
  const reference = `EFT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const payment = await Payment.create({
    user: req.user._id,
    order: orderId,
    amount,
    currency: 'ZAR',
    paymentMethod: 'direct-eft',
    status: 'pending',
    gatewayData: {
      bankName,
      reference,
      accountNumber: process.env.BANK_ACCOUNT_NUMBER,
      branchCode: process.env.BANK_BRANCH_CODE,
      accountName: process.env.BANK_ACCOUNT_NAME,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });

  res.status(200).json({
    success: true,
    message: 'Direct EFT payment details',
    paymentId: payment._id,
    paymentDetails: {
      bankName: process.env.BANK_NAME,
      accountNumber: process.env.BANK_ACCOUNT_NUMBER,
      accountName: process.env.BANK_ACCOUNT_NAME,
      branchCode: process.env.BANK_BRANCH_CODE,
      reference,
      amount,
      dueDate: payment.gatewayData.expiresAt
    }
  });
});

// Stripe webhook handler
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handleFailedPayment(failedPayment);
      break;
    case 'charge.refunded':
      const charge = event.data.object;
      await handleRefund(charge);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Helper function for successful payments
async function handleSuccessfulPayment(paymentIntent) {
  const { metadata } = paymentIntent;
  
  await Payment.findOneAndUpdate(
    { 'gatewayData.paymentIntentId': paymentIntent.id },
    {
      status: 'completed',
      'gatewayData.transactionId': paymentIntent.id,
      paidAt: new Date()
    }
  );

  await Order.findOneAndUpdate(
    { orderId: metadata.orderId },
    {
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
      'paymentDetails.transactionId': paymentIntent.id,
      'paymentDetails.paidAt': new Date()
    }
  );
}

// Get payment history
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, method } = req.query;
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };
  if (status) filter.status = status;
  if (method) filter.paymentMethod = method;

  const payments = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('order', 'orderId total');

  const total = await Payment.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: payments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
