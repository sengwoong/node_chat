const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const VideoRepository = require('../repositories/videoRepository');

class StreamController {
  constructor() {
    this.videoRepository = new VideoRepository();

    // Bind methods to the instance to ensure correct 'this' context
    this.serveStreamPage = this.serveStreamPage.bind(this);
    this.serveWatchPage = this.serveWatchPage.bind(this);
    this.getStreamVideos = this.getStreamVideos.bind(this);
  }

  // Serve the streaming page
  serveStreamPage(req, res) {
    // Get user ID from userIdFromPath or params or default to 'default'
    const userId = req.userIdFromPath || req.params.userId || 'default';
    console.log(`[serveStreamPage] userId: ${userId}, path: ${req.path}, originalUrl: ${req.originalUrl}`);
    console.log(`[serveStreamPage] req.params:`, req.params);
    console.log(`[serveStreamPage] req.baseUrl:`, req.baseUrl);
    
    res.sendFile(path.join(config.paths.streamHtmlDir, 'stream.html'));
  }

  // Serve the individual video watch page
  serveWatchPage(req, res) {
    // Get user ID from userIdFromPath or params or default to 'default'
    const userId = req.userIdFromPath || req.params.userId || 'default';
    console.log(`[serveWatchPage] userId: ${userId}, path: ${req.path}, originalUrl: ${req.originalUrl}`);
    console.log(`[serveWatchPage] req.params:`, req.params);
    console.log(`[serveWatchPage] req.baseUrl:`, req.baseUrl);
    
    res.sendFile(path.join(config.paths.streamHtmlDir, 'stream.html'));
  }

  // Get all available videos for streaming
  async getStreamVideos(req, res) {
    try {
      // Get user ID from userIdFromPath or params or default to 'default'
      const userId = req.userIdFromPath || req.params.userId || 'default';
      console.log(`[getStreamVideos] userId: ${userId}, path: ${req.path}, originalUrl: ${req.originalUrl}`);
      console.log(`[getStreamVideos] req.params:`, req.params);
      console.log(`[getStreamVideos] req.baseUrl:`, req.baseUrl);
      
      const videos = await this.videoRepository.getAllVideos(userId);
      
      // Add stream paths
      videos.forEach(video => {
        video.path = `/${userId}/stream/video/${video.name}`;
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