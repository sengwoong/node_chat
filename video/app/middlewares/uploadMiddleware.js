const multer = require('multer');
const path = require('path');
const { randomUUID } = require('crypto');
const config = require('../config/config');

// Configure multer storage for screen recordings (temp storage)
const tempStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, config.paths.tempDir);
  },
  filename: function(req, file, cb) {
    const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    cb(null, `screen_${now}_${randomUUID()}.webm`);
  }
});

const uploadTemp = multer({ storage: tempStorage });

// Configure storage for direct file uploads
const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, config.paths.recordedDir);
  },
  filename: function(req, file, cb) {
    // Keep original filename but add timestamp and UUID to prevent duplicates
    const originalName = file.originalname;
    const fileExt = path.extname(originalName);
    const fileName = path.basename(originalName, fileExt);
    const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    cb(null, `${fileName}_${now}${fileExt}`);
  }
});

const uploadHandler = multer({ 
  storage: uploadStorage,
  fileFilter: function(req, file, cb) {
    // Only allow mp4 and webm files
    if (file.mimetype === 'video/mp4' || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Only mp4 or webm files are allowed.'), false);
    }
  },
  limits: {
    fileSize: config.upload.videoSizeLimit // 500MB limit
  }
});

module.exports = {
  uploadTemp,
  uploadHandler
}; 