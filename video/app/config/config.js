const path = require('path');

// Create directories configuration
const config = {
  port: 8080,
  paths: {
    recordedDir: path.join(__dirname, '../../recorded'),
    tempDir: path.join(__dirname, '../../temp'),
    publicDir: path.join(__dirname, '../../public'),
    streamHtmlDir: path.join(__dirname, '../../stream.html')
  },
  upload: {
    videoSizeLimit: 1024 * 1024 * 500 // 500MB limit
  }
};

module.exports = config; 