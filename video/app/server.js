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
const streamDir = path.join(__dirname, '../public/stream');

if (!fs.existsSync(recordedDir)) {
  fs.mkdirSync(recordedDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

if (!fs.existsSync(streamDir)) {
  fs.mkdirSync(streamDir, { recursive: true });
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Map to keep track of active streams
const activeStreams = new Map();

// Route to serve the screen recording page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Route to serve the viewer page
app.get('/view/:streamId', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/viewer.html'));
});

// Handle screen recording upload with streaming
app.post('/upload', upload.single('video'), (req, res) => {
  console.log('Upload request received:', req.file ? 'with file' : 'without file');
  
  if (!req.file) {
    return res.status(400).json({ error: 'No screen recording file uploaded' });
  }

  const inputPath = req.file.path;
  const now = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const streamId = randomUUID();
  const outputPath = path.join(recordedDir, `screen_${now}.mp4`);
  const streamPath = path.join(streamDir, streamId);
  
  if (!fs.existsSync(streamPath)) {
    fs.mkdirSync(streamPath, { recursive: true });
  }

  console.log(`Creating streaming path: ${streamPath}`);
  console.log(`Input file: ${inputPath}`);

  try {
    // Set up HLS streaming and recording simultaneously
    const ffmpegCommand = ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-hls_time 4',
        '-hls_list_size 10',
        '-hls_flags delete_segments',
        '-hls_segment_filename', `${streamPath}/segment_%03d.ts`
      ])
      .output(`${streamPath}/playlist.m3u8`) // HLS output
      .output(outputPath) // MP4 recording output
      .on('start', () => {
        console.log('Started streaming and recording process');
        
        // Register the active stream
        activeStreams.set(streamId, {
          id: streamId,
          path: `/stream/${streamId}/playlist.m3u8`,
          startTime: new Date(),
          outputPath: outputPath
        });
        
        // Return stream info to client
        res.json({
          success: true,
          message: '스트리밍 및 녹화가 시작되었습니다.',
          streamId: streamId,
          viewUrl: `/view/${streamId}`,
          streamUrl: `/stream/${streamId}/playlist.m3u8`
        });
      })
      .on('end', () => {
        console.log('Streaming and recording completed');
        activeStreams.delete(streamId);
        
        // Clean up the temp file
        fs.unlink(inputPath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      })
      .on('error', (err) => {
        console.error('Error during streaming and recording:', err);
        activeStreams.delete(streamId);
        
        // Clean up the temp file
        fs.unlink(inputPath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      });
    
    // Start the FFmpeg process
    ffmpegCommand.run();
  } catch (error) {
    console.error('Exception during FFmpeg setup:', error);
    res.status(500).json({ error: 'FFmpeg 프로세스 시작 중 오류가 발생했습니다.' });
    
    // Clean up the temp file
    fs.unlink(inputPath, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
  }
});

// Endpoint to stop streaming and get the recorded file
app.post('/stop-stream/:streamId', (req, res) => {
  const { streamId } = req.params;
  console.log(`Stop stream request for ID: ${streamId}`);
  
  const stream = activeStreams.get(streamId);
  
  if (!stream) {
    return res.status(404).json({ error: '스트림을 찾을 수 없습니다.' });
  }

  // Send the recorded file
  res.download(stream.outputPath, `screen_recording.mp4`, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      return res.status(500).json({ error: '파일 전송 중 오류가 발생했습니다.' });
    }
    
    // Remove from active streams
    activeStreams.delete(streamId);
  });
});

// Get active streams
app.get('/streams', (req, res) => {
  const streams = Array.from(activeStreams.values()).map(stream => ({
    id: stream.id,
    path: stream.path,
    startTime: stream.startTime
  }));
  
  res.json(streams);
});

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
  console.log(`Screen recording and streaming server running at http://localhost:${port}`);
}); 