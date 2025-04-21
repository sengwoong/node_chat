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
router.get('/', (req, res) => streamController.serveStreamPage(req, res));

// Individual video watch page
router.get('/watch', (req, res) => streamController.serveWatchPage(req, res));

// Get all videos for streaming
router.get('/videos', (req, res) => streamController.getStreamVideos(req, res));

// Stream a video file
router.get('/video/:filename', (req, res) => videoController.streamVideo(req, res));

module.exports = router; 