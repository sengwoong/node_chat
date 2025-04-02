const express = require('express');
const router = express.Router({ mergeParams: true });
const streamController = require('../controllers/streamController');
const videoController = require('../controllers/videoController');

// Log middleware to trace routes
router.use((req, res, next) => {
  console.log(`[streamRoutes] Accessed route: ${req.method} ${req.originalUrl}, userId: ${req.params.userId || 'not set'}`);
  // Make sure userIdFromPath is set from the parent router
  if (req.params.userId && !req.userIdFromPath) {
    req.userIdFromPath = req.params.userId;
    console.log(`[streamRoutes] Setting userIdFromPath: ${req.userIdFromPath}`);
  }
  next();
});

// Stream player page
router.get('/', streamController.serveStreamPage);

// Individual video watch page
router.get('/watch', streamController.serveWatchPage);

// Get all videos for streaming
router.get('/videos', streamController.getStreamVideos);

// Stream a video file
router.get('/video/:filename', videoController.streamVideo);

module.exports = router; 