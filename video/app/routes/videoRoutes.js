const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { uploadTemp, uploadHandler } = require('../middlewares/uploadMiddleware');

// Convert WebM to MP4
router.post('/convert', uploadTemp.single('video'), videoController.convertVideo);

// Save WebM without conversion
router.post('/save', uploadTemp.single('video'), videoController.saveWebm);

// Get all recorded videos
router.get('/recordings', videoController.getAllVideos);

// Handle direct file upload
router.post('/upload', uploadHandler.single('video'), videoController.uploadVideo);

module.exports = router; 