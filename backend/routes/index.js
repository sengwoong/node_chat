const express = require('express');
const chatRoutes = require('../chat/chatRoutes');
const rtcRoutes = require('../rtc/rtcRoutes');
const videoRoutes = require('../video/videoRoutes');
const lectureRoutes = require('../lecture/lectureRoutes');
const userRoutes = require('./userRoutes');
const classRoutes = require('./classRoutes');
const courseRoutes = require('./courseRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const { authenticateToken } = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 서버 헬스 체크
 *     description: 서버가 정상적으로 실행 중인지 확인합니다.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: 서버가 정상 실행 중
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 서버가 정상적으로 실행 중입니다
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '서버가 정상적으로 실행 중입니다',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @swagger
 * /version:
 *   get:
 *     summary: API 버전 정보
 *     description: 현재 API의 버전 정보를 조회합니다.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API 버전 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     name:
 *                       type: string
 *                       example: "Unified Backend API"
 *                     description:
 *                       type: string
 *                       example: "통합된 백엔드 서비스 - 채팅, 비디오, RTC, 강의 관리"
 */
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      name: 'Unified Backend API',
      description: '통합된 백엔드 서비스 - 채팅, 비디오, RTC, 강의 관리'
    }
  });
});

/**
 * @swagger
 * /status:
 *   get:
 *     summary: 서버 상태 정보
 *     description: 서버의 상세한 상태 정보를 조회합니다. 인증이 필요합니다.
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 서버 상태 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     server:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                         memory:
 *                           type: object
 *                         cpu:
 *                           type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/status', authenticateToken, (req, res) => {
  const status = {
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json({
    success: true,
    data: status
  });
});

// 모듈별 라우트 등록
router.use('/chat', chatRoutes);
router.use('/rtc', rtcRoutes);
router.use('/video', videoRoutes);
router.use('/lecture', lectureRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);

// 404 처리
router.use('*', (req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다',
    path: req.originalUrl
  });
});

module.exports = router; 