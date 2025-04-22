const fs = require('fs');
const path = require('path');
const VideoRepository = require('../repositories/videoRepository');

class VideoController {
  constructor() {
    this.videoRepository = new VideoRepository();
    
    // Bind all methods to this instance
    this.getAllVideos = this.getAllVideos.bind(this);
    this.convertVideo = this.convertVideo.bind(this);
    this.saveWebm = this.saveWebm.bind(this);
    this.uploadVideo = this.uploadVideo.bind(this);
    this.streamVideo = this.streamVideo.bind(this);
    this.getUserId = this.getUserId.bind(this);
  }

  // Helper method to get userId from request
  getUserId(req) {
    // First try to get from userIdFromPath (set by router)
    const userIdFromPath = req.userIdFromPath;
    if (userIdFromPath) {
      console.log(`[VideoController] Using userIdFromPath: ${userIdFromPath}`);
      return userIdFromPath;
    }
    
    // If not found, try to extract from baseUrl
    if (req.baseUrl) {
      const userId = req.baseUrl.split('/')[1];
      if (userId) {
        console.log(`[VideoController] Extracted userId from baseUrl: ${userId}`);
        return userId;
      }
    }

    // Default fallback
    console.log('[VideoController] No userId found, using default');
    return 'default';
  }

  // Get all recorded videos for a specific user
  async getAllVideos(req, res) {
    const userId = this.getUserId(req);
    console.log(`[getAllVideos] userId: ${userId}, path: ${req.path}`);
    
    try {
      const videos = await this.videoRepository.getAllVideos(userId);
      res.json(videos);
    } catch (error) {
      console.error('[getAllVideos] Error:', error);
      res.status(500).json({ error: 'Failed to get videos' });
    }
  }

  // Convert WebM to MP4
  async convertVideo(req, res) {
    const userId = this.getUserId(req);
    console.log(`[convertVideo] userId: ${userId}, path: ${req.path}, file:`, req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    try {
      const result = await this.videoRepository.convertVideo(req.file.path, req.query.quality, userId);
      res.json(result);
    } catch (error) {
      console.error('[convertVideo] Error:', error);
      res.status(500).json({ error: 'Video conversion failed' });
    }
  }

  // Save WebM without conversion
  async saveWebm(req, res) {
    const userId = this.getUserId(req);
    console.log(`[saveWebm] userId: ${userId}, path: ${req.path}, originalUrl: ${req.originalUrl}`);
    console.log(`[saveWebm] req.params:`, req.params);
    console.log(`[saveWebm] req.baseUrl:`, req.baseUrl);

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    try {
      const result = await this.videoRepository.saveWebmFile(req.file.path, userId);
      res.json(result);
    } catch (error) {
      console.error('[saveWebm] Error:', error);
      res.status(500).json({ error: 'Failed to save WebM file' });
    }
  }

  // Handle direct file upload
  async uploadVideo(req, res) {
    const userId = this.getUserId(req);
    console.log(`[uploadVideo] userId: ${userId}, path: ${req.path}, file:`, req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    };

    console.log(`[uploadVideo] File uploaded to user directory ${userId}:`, fileInfo);
    res.status(200).json({ message: 'File uploaded successfully', file: fileInfo });
  }

  // Stream video with support for HTTP Range requests
  async streamVideo(req, res) {
    const userId = this.getUserId(req);
    const filename = req.params.filename;
    console.log(`[streamVideo] userId: ${userId}, filename: ${filename}`);

    try {
      const { filepath } = this.videoRepository.getVideoStream(filename, userId);
      
      // Check if file exists
      if (!fs.existsSync(filepath)) {
        console.error(`[streamVideo] File not found: ${filepath}`);
        return res.status(404).json({ error: 'Video file not found' });
      }

      const stat = fs.statSync(filepath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Determine content type based on file extension
      let contentType = 'video/webm';
      if (filename.endsWith('.mp4')) {
        contentType = 'video/mp4';
      } else if (filename.endsWith('.webm')) {
        contentType = 'video/webm';
      }
      
      console.log(`[streamVideo] Streaming file: ${filepath}, size: ${fileSize}, type: ${contentType}`);

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filepath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(filepath).pipe(res);
      }
    } catch (error) {
      console.error('[streamVideo] Error:', error);
      res.status(500).json({ error: 'Failed to stream video' });
    }
  }
}

module.exports = new VideoController(); 