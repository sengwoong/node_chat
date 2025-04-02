const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const videoRepository = require('../repositories/videoRepository');

class StreamController {
  // Serve the streaming page
  serveStreamPage(req, res) {
    res.sendFile(path.join(config.paths.streamHtmlDir, 'stream.html'));
  }

  // Serve the individual video watch page
  serveWatchPage(req, res) {
    res.sendFile(path.join(config.paths.streamHtmlDir, 'stream.html'));
  }

  // Get all available videos for streaming
  async getStreamVideos(req, res) {
    try {
      const videos = await videoRepository.getAllVideos();
      // Sort by creation date (newest first)
      videos.forEach(video => {
        video.path = `/stream/video/${video.name}`;
        video.type = video.name.endsWith('.mp4') ? 'video/mp4' : 'video/webm';
      });
      
      res.json(videos);
    } catch (error) {
      console.error('Error reading stream directory:', error);
      res.status(500).json({ error: '비디오 목록을 불러오는데 실패했습니다.' });
    }
  }
}

module.exports = new StreamController(); 