const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  createCourse,
  uploadCourseVideo,
  createDocument,
  createZipPackage,
  getMyCreatorProducts,
  updateProduct,
  deleteProduct,
  getCreatorAnalytics
} = require('../controllers/creator.controller');
const { validateCreatorProduct } = require('../middleware/creatorValidation');

// All routes require authentication and creator role
router.use(authMiddleware.protect);
router.use(authMiddleware.requireCreator); // middleware to check if user is a creator

// Course creation
router.post('/course', upload.fields([{ name: 'thumbnail' }, { name: 'video' }]), createCourse);
router.post('/course/:id/lesson', upload.single('video'), uploadCourseVideo);

// Document creation
router.post('/document', upload.single('file'), createDocument);

// ZIP package creation
router.post('/zip', upload.array('files'), createZipPackage);

// Management
router.get('/products', getMyCreatorProducts);
router.put('/product/:id', upload.any(), updateProduct);
router.delete('/product/:id', deleteProduct);

// Analytics
router.get('/analytics', getCreatorAnalytics);

module.exports = router;
