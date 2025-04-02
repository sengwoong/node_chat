const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const videoController = require('../controllers/videoController');

// Stream player page
router.get('/', streamController.serveStreamPage);

// Individual video watch page
router.get('/watch/:filename', streamController.serveWatchPage);

// Get all videos for streaming
router.get('/videos', streamController.getStreamVideos);

// Stream a video file
router.get('/video/:filename', videoController.streamVideo);

module.exports = router; 