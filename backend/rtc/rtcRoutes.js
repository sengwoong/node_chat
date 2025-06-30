const express = require('express');
const rtcController = require('./rtcController');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const constants = require('../config/constants');

const router = express.Router();

// RTC 방 관리 라우트
router.post('/rooms', authenticateToken, rtcController.createRoom);
router.get('/rooms', rtcController.getRoomList);
router.get('/rooms/:roomId', rtcController.getRoomInfo);
router.delete('/rooms/:roomId', authenticateToken, rtcController.deleteRoom);

// RTC 방 참가자 관리
router.get('/rooms/:roomId/participants', rtcController.getRoomParticipants);
router.get('/rooms/:roomId/access', rtcController.checkRoomAccess);

// RTC 방 설정
router.put('/rooms/:roomId/settings', authenticateToken, rtcController.updateRoomSettings);

// RTC 연결 토큰
router.post('/token', authenticateToken, rtcController.generateConnectionToken);

// RTC 서버 상태
router.get('/stats', rtcController.getServerStats);

module.exports = router; 