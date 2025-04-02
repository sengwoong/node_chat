const fs = require('fs');
const path = require('path');
const videoRepository = require('../repositories/videoRepository');

class VideoController {
  // Get all recorded videos
  async getAllVideos(req, res) {
    try {
      const videos = await videoRepository.getAllVideos();
      res.json(videos);
    } catch (error) {
      console.error('Error getting videos:', error);
      res.status(500).json({ error: '녹화 목록을 불러오는데 실패했습니다.' });
    }
  }

  // Convert WebM to MP4
  async convertVideo(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: '동영상 파일이 업로드되지 않았습니다.' });
    }

    const inputPath = req.file.path;
    const quality = req.query.quality || '720';
    const downloadRequested = req.query.download !== 'false';
    
    try {
      const result = await videoRepository.convertVideo(inputPath, quality);
      
      if (downloadRequested) {
        // Send file as download
        res.download(result.outputPath, result.filename, (err) => {
          if (err) {
            console.error('Error sending file:', err);
          }
        });
      } else {
        // Send JSON response
        res.json({
          success: true,
          message: 'MP4 변환이 완료되었습니다.',
          filename: result.filename,
          path: `/recordings/${result.filename}`,
          size: result.size
        });
      }
    } catch (error) {
      console.error('Error in video conversion:', error);
      res.status(500).json({ error: '비디오 변환 중 오류가 발생했습니다.' });
    }
  }

  // Save WebM without conversion
  async saveWebm(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: '동영상 파일이 업로드되지 않았습니다.' });
    }

    const inputPath = req.file.path;
    const downloadRequested = req.query.download !== 'false';
    
    try {
      const result = await videoRepository.saveWebmFile(inputPath);
      
      if (downloadRequested) {
        // Send file as download
        res.download(result.outputPath, result.filename, (err) => {
          if (err) {
            console.error('Error sending file:', err);
          }
        });
      } else {
        // Send JSON response
        res.json({
          success: true,
          message: 'WebM 파일이 저장되었습니다.',
          filename: result.filename,
          path: `/recordings/${result.filename}`,
          size: result.size
        });
      }
    } catch (error) {
      console.error('Error saving WebM:', error);
      res.status(500).json({ error: '파일 저장 중 오류가 발생했습니다.' });
    }
  }

  // Handle direct file upload
  async uploadVideo(req, res) {
    if (!req.file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    // File upload info
    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/recordings/${req.file.filename}`
    };
    
    console.log(`File uploaded: ${fileInfo.filename}`);
    
    // Success response
    res.status(200).json({
      success: true,
      message: '파일이 성공적으로 업로드되었습니다.',
      file: fileInfo
    });
  }

  // Stream video with support for HTTP Range requests
  streamVideo(req, res) {
    const filename = req.params.filename;
    const { filepath } = videoRepository.getVideoStream(filename);
    
    // Check if file exists
    fs.stat(filepath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).send('파일을 찾을 수 없습니다.');
        }
        console.error('Error checking file:', err);
        return res.status(500).send('서버 오류가 발생했습니다.');
      }
      
      // Determine content type
      const contentType = filename.endsWith('.mp4') ? 'video/mp4' : 'video/webm';
      
      // File size
      const fileSize = stats.size;
      
      // Check for Range header
      const range = req.headers.range;
      
      if (range) {
        // Parse range header
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        // If end is not specified, use file end
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        
        // Validate range
        if (start >= fileSize || end >= fileSize) {
          return res.status(416).send('Requested Range Not Satisfiable');
        }
        
        // Chunk size
        const chunkSize = (end - start) + 1;
        
        // Set response headers
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType
        });
        
        // Create file stream and pipe to response
        const stream = fs.createReadStream(filepath, { start, end });
        stream.pipe(res);
        
        // Handle errors
        stream.on('error', err => {
          console.error('Stream error:', err);
          if (!res.headersSent) {
            res.status(500).send('스트리밍 중 오류가 발생했습니다.');
          }
        });
      } else {
        // If no Range header, send entire file
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType
        });
        
        const stream = fs.createReadStream(filepath);
        stream.pipe(res);
        
        stream.on('error', err => {
          console.error('Stream error:', err);
          if (!res.headersSent) {
            res.status(500).send('스트리밍 중 오류가 발생했습니다.');
          }
        });
      }
    });
  }
}

module.exports = new VideoController(); 