const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const videoController = require('./videoController');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');
const config = require('../config/env');
const constants = require('../config/constants');

const router = express.Router();

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../uploads');
const streamDir = path.join(__dirname, '../stream');
const recordedDir = path.join(__dirname, '../recorded');

[uploadDir, streamDir, recordedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = constants.FILE_TYPES.VIDEO;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 비디오 형식입니다'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  }
});

// 비디오 업로드 및 관리
router.post('/upload', authenticateToken, upload.single('video'), videoController.uploadVideo);
router.get('/videos', optionalAuth, videoController.getVideoList);
router.get('/videos/:videoId', optionalAuth, videoController.getVideoInfo);
router.delete('/videos/:videoId', authenticateToken, videoController.deleteVideo);
router.put('/videos/:videoId', authenticateToken, videoController.updateVideoMetadata);

// 비디오 스트리밍
router.get('/videos/:videoId/stream', optionalAuth, videoController.getStreamingUrl);
router.get('/videos/:videoId/download', optionalAuth, videoController.downloadVideo);

// 라이브 스트리밍
router.post('/stream/start', authenticateToken, videoController.startStreaming);
router.post('/stream/:streamId/stop', authenticateToken, videoController.stopStreaming);
router.get('/stream/:streamId/status', videoController.getLiveStreamStatus);

// 비디오 처리 상태
router.get('/videos/:videoId/processing', videoController.getProcessingStatus);

// 정적 파일 서빙 (스트리밍 파일)
router.use('/stream', express.static(streamDir));
router.use('/recorded', express.static(recordedDir));

module.exports = router; 