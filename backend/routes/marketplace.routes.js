const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const vendorController = require('../controllers/marketplace/vendor.controller');
const listingController = require('../controllers/marketplace/listing.controller');
const marketplaceOrderController = require('../controllers/marketplace/order.controller');
const payoutController = require('../controllers/marketplace/payout.controller');

// Vendor routes
router.post('/vendor/register', authMiddleware.protect, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), vendorController.registerVendor);
router.get('/vendor/profile', authMiddleware.protect, vendorController.getVendorProfile);
router.put('/vendor/profile', authMiddleware.protect, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), vendorController.updateVendor);
router.put('/vendor/payout-settings', authMiddleware.protect, vendorController.updatePayoutSettings);
router.get('/vendor/stats', authMiddleware.protect, vendorController.getVendorStats);
router.get('/vendor/public/:identifier', vendorController.getPublicVendor);

// Admin vendor management
router.get('/admin/vendors', authMiddleware.protect, authMiddleware.restrictTo('admin'), vendorController.getAllVendors);
router.put('/admin/vendors/:vendorId/status', authMiddleware.protect, authMiddleware.restrictTo('admin'), vendorController.updateVendorStatus);

// Listing routes
router.post('/listings', authMiddleware.protect, upload.fields([{ name: 'files' }, { name: 'images' }]), listingController.createListing);
router.get('/listings/my', authMiddleware.protect, listingController.getMyListings);
router.put('/listings/:id', authMiddleware.protect, upload.fields([{ name: 'files' }, { name: 'images' }]), listingController.updateListing);
router.delete('/listings/:id', authMiddleware.protect, listingController.deleteListing);
router.get('/listings/search', listingController.searchListings);
router.get('/listings/:id', listingController.getListing);
router.post('/listings/:id/reviews', authMiddleware.protect, listingController.addReview);

// Admin listing management
router.put('/admin/listings/:listingId/status', authMiddleware.protect, authMiddleware.restrictTo('admin'), listingController.updateListingStatus);

// Marketplace order routes
router.post('/orders', authMiddleware.protect, marketplaceOrderController.createMarketplaceOrder);
router.get('/orders/vendor', authMiddleware.protect, marketplaceOrderController.getVendorOrders);
router.get('/orders/:orderId/items/:itemId/download', authMiddleware.protect, marketplaceOrderController.downloadItem);

// Payout routes
router.post('/payouts/request', authMiddleware.protect, payoutController.requestPayout);
router.get('/payouts/history', authMiddleware.protect, payoutController.getPayoutHistory);

// Admin payout routes
router.get('/admin/payouts', authMiddleware.protect, authMiddleware.restrictTo('admin'), payoutController.getAllPayouts);
router.put('/admin/payouts/:payoutId', authMiddleware.protect, authMiddleware.restrictTo('admin'), payoutController.processPayout);

module.exports = router;
