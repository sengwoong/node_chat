const express = require('express');
const router = express.Router({ mergeParams: true });
const videoController = require('../controllers/videoController');
const { uploadTemp, uploadHandler } = require('../middlewares/uploadMiddleware');

// Log middleware to trace routes
router.use((req, res, next) => {
  console.log(`[videoRoutes] Accessed route: ${req.method} ${req.originalUrl}, userId: ${req.params.userId || 'not set'}`);
  // Make sure userIdFromPath is set from the parent router
  if (req.params.userId && !req.userIdFromPath) {
    req.userIdFromPath = req.params.userId;
    console.log(`[videoRoutes] Setting userIdFromPath: ${req.userIdFromPath}`);
  }
  next();
});

// User-specific routes - These will be prefixed with userId in server.js
// Convert WebM to MP4
router.post('/convert', uploadTemp.single('video'), videoController.convertVideo);

// Save WebM without conversion
router.post('/save', uploadTemp.single('video'), videoController.saveWebm);

// Get all recorded videos
router.get('/recordings', videoController.getAllVideos);

// Handle direct file upload
router.post('/upload', uploadHandler.single('video'), videoController.uploadVideo);

module.exports = router; 