const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const config = require('../config/config');

// Helper function to get or create user directory
function getUserDir(userId) {
  const userDir = path.join(config.paths.recordedDir, userId);
  if (!fs.existsSync(userDir)) {
    console.log(`[uploadMiddleware] Creating user directory: ${userDir}`);
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

// Configure multer storage for screen recordings (temp storage)
const tempStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Log request params for debugging
    console.log(`[uploadMiddleware] tempStorage destination - userId: ${req.params.userId || 'unknown'}, path: ${req.path}`);
    cb(null, config.paths.tempDir);
  },
  filename: function(req, file, cb) {
    const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const filename = `screen_${now}_${randomUUID()}.webm`;
    console.log(`[uploadMiddleware] tempStorage creating file: ${filename}`);
    cb(null, filename);
  }
});

const uploadTemp = multer({ 
  storage: tempStorage,
  limits: {
    fileSize: 1024 * 1024 * 500 // 500MB limit
  }
});

// Configure storage for direct file uploads with user-specific directory
const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Get userId from request params or default to 'default'
    const userId = req.params.userId || 'default';
    console.log(`[uploadMiddleware] uploadStorage destination - userId: ${userId}, path: ${req.path}`);
    const userDir = getUserDir(userId);
    cb(null, userDir);
  },
  filename: function(req, file, cb) {
    // Keep original filename but add timestamp to prevent duplicates
    const originalName = file.originalname;
    const fileExt = path.extname(originalName);
    const fileName = path.basename(originalName, fileExt);
    const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const newFilename = `${fileName}_${now}${fileExt}`;
    console.log(`[uploadMiddleware] uploadStorage creating file: ${newFilename}`);
    cb(null, newFilename);
  }
});

const uploadHandler = multer({ 
  storage: uploadStorage,
  fileFilter: function(req, file, cb) {
    console.log(`[uploadMiddleware] uploadHandler fileFilter - mimetype: ${file.mimetype}`);
    // Only allow mp4 and webm files
    if (file.mimetype === 'video/mp4' || file.mimetype === 'video/webm') {
      cb(null, true);
    } else {
      console.log(`[uploadMiddleware] Rejected file with mimetype: ${file.mimetype}`);
      cb(new Error('Unsupported file format. Only mp4 or webm files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 800 // 800MB limit - increased for safety
  }
});

module.exports = {
  uploadTemp,
  uploadHandler
}; 