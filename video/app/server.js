const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { randomUUID } = require('crypto');

const app = express();
const port = 8080;

// Create directories if they don't exist
const recordedDir = path.join(__dirname, '../recorded');
const tempDir = path.join(__dirname, '../temp');

if (!fs.existsSync(recordedDir)) {
  fs.mkdirSync(recordedDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer storage for screen recordings
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, tempDir);
  },
  filename: function(req, file, cb) {
    const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    cb(null, `screen_${now}_${randomUUID()}.webm`);
  }
});

const upload = multer({ storage: storage });

// Enable CORS with more explicit configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Add middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Route to serve the screen recording page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 스트림 관련 라우트 (stream.js에서 통합)
// 스트림 플레이어 페이지
app.get('/stream', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/stream.html'));
});

// 특정 영상 시청 페이지
app.get('/stream/watch/:filename', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/stream.html'));
});

// 모든 비디오 파일 목록 가져오기
app.get('/stream/videos', (req, res) => {
  fs.readdir(recordedDir, (err, files) => {
    if (err) {
      console.error('Error reading stream directory:', err);
      return res.status(500).json({ error: '비디오 목록을 불러오는데 실패했습니다.' });
    }
    
    // 비디오 파일만 필터링 (mp4, webm)
    const videoFiles = files.filter(file => 
      file.endsWith('.mp4') || file.endsWith('.webm')
    );
    
    // 파일 정보 가져오기
    const videoList = videoFiles.map(file => {
      const stats = fs.statSync(path.join(recordedDir, file));
      return {
        name: file,
        size: stats.size,
        path: `/stream/video/${file}`,
        type: file.endsWith('.mp4') ? 'video/mp4' : 'video/webm',
        created: stats.birthtime
      };
    });
    
    // 생성 날짜 기준 내림차순 정렬 (최신 영상이 위로)
    videoList.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json(videoList);
  });
});

// 비디오 스트리밍 (HTTP Range 요청 처리)
app.get('/stream/video/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(recordedDir, filename);
  
  // 파일이 존재하는지 확인
  fs.stat(filepath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('파일을 찾을 수 없습니다.');
      }
      console.error('Error checking file:', err);
      return res.status(500).send('서버 오류가 발생했습니다.');
    }
    
    // Content-Type 결정
    const contentType = filename.endsWith('.mp4') ? 'video/mp4' : 'video/webm';
    
    // 파일 크기
    const fileSize = stats.size;
    
    // Range 헤더 체크
    const range = req.headers.range;
    
    if (range) {
      // Range 형식: "bytes=start-end"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      // end가 없는 경우 파일의 끝까지
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      // 유효한 범위인지 확인
      if (start >= fileSize || end >= fileSize) {
        return res.status(416).send('Requested Range Not Satisfiable');
      }
      
      // 청크 크기
      const chunkSize = (end - start) + 1;
      
      // 응답 헤더 설정
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      
      // 파일 스트림 생성 및 응답
      const stream = fs.createReadStream(filepath, { start, end });
      stream.pipe(res);
      
      // 에러 처리
      stream.on('error', err => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('스트리밍 중 오류가 발생했습니다.');
        }
      });
    } else {
      // Range 헤더가 없는 경우 전체 파일 전송
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
});

// Handle video conversion request
app.post('/convert', upload.single('video'), (req, res) => {
  console.log('Conversion request received:', req.file ? 'with file' : 'without file');
  
  if (!req.file) {
    return res.status(400).json({ error: '동영상 파일이 업로드되지 않았습니다.' });
  }

  const inputPath = req.file.path;
  const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const quality = req.query.quality || '720';
  const outputFilename = `screen_${now}_${quality}p.mp4`;
  const outputPath = path.join(recordedDir, outputFilename);
  
  // Check if download is requested or just save to server
  const downloadRequested = req.query.download !== 'false';
  
  // Define quality settings for different resolutions
  const qualitySettings = {
    '360': { resolution: '640x360', videoBitrate: '800k', audioBitrate: '96k' },
    '480': { resolution: '854x480', videoBitrate: '1500k', audioBitrate: '128k' },
    '720': { resolution: '1280x720', videoBitrate: '2500k', audioBitrate: '192k' },
    '1080': { resolution: '1920x1080', videoBitrate: '5000k', audioBitrate: '256k' },
    '1440': { resolution: '2560x1440', videoBitrate: '8000k', audioBitrate: '320k' },
    '4k': { resolution: '3840x2160', videoBitrate: '16000k', audioBitrate: '384k' }
  };
  
  // Use the requested quality settings or default to 720p if invalid
  const videoSettings = qualitySettings[quality] || qualitySettings['720'];

  console.log(`Converting video: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Using quality settings: ${quality}p - ${videoSettings.resolution}`);
  console.log(`Download requested: ${downloadRequested}`);

  try {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(videoSettings.resolution)
      .videoBitrate(videoSettings.videoBitrate)
      .audioBitrate(videoSettings.audioBitrate)
      .output(outputPath)
      .on('start', () => {
        console.log('Started video conversion process');
      })
      .on('end', () => {
        console.log('Video conversion completed');
        console.log(`File saved to: ${outputPath}`);
        
        if (downloadRequested) {
          // Send the file as download
          res.download(outputPath, outputFilename, (err) => {
            if (err) {
              console.error('Error sending file:', err);
            }
            
            // Clean up the temp file
            fs.unlink(inputPath, (err) => {
              if (err) console.error('Error deleting temp file:', err);
            });
          });
        } else {
          // Just send success response with file info
          res.json({
            success: true,
            message: 'MP4 변환이 완료되었습니다.',
            filename: outputFilename,
            path: `/recordings/${outputFilename}`,
            size: fs.statSync(outputPath).size
          });
          
          // Clean up the temp file
          fs.unlink(inputPath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        }
      })
      .on('error', (err) => {
        console.error('Error during video conversion:', err);
        res.status(500).json({ error: '비디오 변환 중 오류가 발생했습니다.' });
        
        // Clean up the temp file
        fs.unlink(inputPath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      })
      .run();
  } catch (error) {
    console.error('Exception during FFmpeg setup:', error);
    res.status(500).json({ error: 'FFmpeg 프로세스 시작 중 오류가 발생했습니다.' });
    
    // Clean up the temp file
    fs.unlink(inputPath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
  }
});

// Handle WebM save request (direct save without conversion)
app.post('/save', upload.single('video'), (req, res) => {
  console.log('Save request received:', req.file ? 'with file' : 'without file');
  
  if (!req.file) {
    return res.status(400).json({ error: '동영상 파일이 업로드되지 않았습니다.' });
  }

  const inputPath = req.file.path;
  const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const quality = req.query.quality || '720';
  const outputFilename = `screen_${now}_${quality}p.webm`;
  const outputPath = path.join(recordedDir, outputFilename);
  
  // Check if download is requested or just save to server
  const downloadRequested = req.query.download !== 'false';
  
  console.log(`Saving WebM video: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Download requested: ${downloadRequested}`);

  try {
    // Copy the file to the recorded directory
    const readStream = fs.createReadStream(inputPath);
    const writeStream = fs.createWriteStream(outputPath);
    
    readStream.pipe(writeStream);
    
    writeStream.on('finish', () => {
      console.log('WebM file saved successfully');
      console.log(`File saved to: ${outputPath}`);
      
      if (downloadRequested) {
        // Send the file as download
        res.download(outputPath, outputFilename, (err) => {
          if (err) {
            console.error('Error sending file:', err);
          }
          
          // Clean up the temp file
          fs.unlink(inputPath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
        });
      } else {
        // Just send success response with file info
        res.json({
          success: true,
          message: 'WebM 파일이 저장되었습니다.',
          filename: outputFilename,
          path: `/recordings/${outputFilename}`,
          size: fs.statSync(outputPath).size
        });
        
        // Clean up the temp file
        fs.unlink(inputPath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }
    });
    
    writeStream.on('error', (err) => {
      console.error('Error saving WebM file:', err);
      res.status(500).json({ error: '파일 저장 중 오류가 발생했습니다.' });
      
      // Clean up the temp file
      fs.unlink(inputPath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    });
  } catch (error) {
    console.error('Exception during file save:', error);
    res.status(500).json({ error: '파일 저장 중 오류가 발생했습니다.' });
    
    // Clean up the temp file
    fs.unlink(inputPath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
  }
});

// Add an endpoint to list all recorded videos
app.get('/recordings', (req, res) => {
  fs.readdir(recordedDir, (err, files) => {
    if (err) {
      console.error('Error reading recorded directory:', err);
      return res.status(500).json({ error: '녹화 목록을 불러오는데 실패했습니다.' });
    }
    
    // Filter video files
    const videoFiles = files.filter(file => 
      file.endsWith('.mp4') || file.endsWith('.webm')
    );
    
    // Get file stats for each video
    const fileDetails = videoFiles.map(file => {
      const filePath = path.join(recordedDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        path: `/recordings/${file}`,
        size: stats.size,
        created: stats.birthtime
      };
    });
    
    res.json(fileDetails);
  });
});

// Serve recorded videos
app.use('/recordings', express.static(recordedDir));

// Handle 404 errors
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// Handle server errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server Error');
});

app.listen(port, () => {
  console.log(`Screen recording server running at http://localhost:${port}`);
}); 