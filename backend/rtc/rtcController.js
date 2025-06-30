const rtcService = require('./rtcService');
const { asyncHandler } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class RTCController {
  // RTC 방 생성
  createRoom = asyncHandler(async (req, res) => {
    const { roomId, userId, maxParticipants } = req.body;
    
    if (!roomId || !userId) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '방 ID와 사용자 ID가 필요합니다'
      });
    }
    
    const result = await rtcService.createRoom(roomId, userId, maxParticipants);
    
    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: result
    });
  });

  // RTC 방 정보 조회
  getRoomInfo = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    
    const roomInfo = await rtcService.getRoomInfo(roomId);
    
    if (!roomInfo) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '방을 찾을 수 없습니다'
      });
    }
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: roomInfo
    });
  });

  // RTC 방 목록 조회
  getRoomList = asyncHandler(async (req, res) => {
    const rooms = await rtcService.getRoomList();
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: rooms
    });
  });

  // RTC 방 삭제
  deleteRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '사용자 ID가 필요합니다'
      });
    }
    
    const result = await rtcService.deleteRoom(roomId, userId);
    
    if (!result) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '방을 찾을 수 없거나 삭제 권한이 없습니다'
      });
    }
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: '방이 삭제되었습니다'
    });
  });

  // RTC 방 참가자 목록 조회
  getRoomParticipants = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    
    const participants = await rtcService.getRoomParticipants(roomId);
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: participants
    });
  });

  // RTC 서버 상태 조회
  getServerStats = asyncHandler(async (req, res) => {
    const stats = await rtcService.getServerStats();
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: stats
    });
  });

  // RTC 연결 토큰 생성 (TURN 서버용)
  generateConnectionToken = asyncHandler(async (req, res) => {
    const { roomId, userId } = req.body;
    
    if (!roomId || !userId) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '방 ID와 사용자 ID가 필요합니다'
      });
    }
    
    const token = await rtcService.generateConnectionToken(roomId, userId);
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: { token }
    });
  });

  // RTC 방 참가 권한 확인
  checkRoomAccess = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '사용자 ID가 필요합니다'
      });
    }
    
    const hasAccess = await rtcService.checkRoomAccess(roomId, userId);
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: { hasAccess }
    });
  });

  // RTC 방 설정 업데이트
  updateRoomSettings = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { userId, settings } = req.body;
    
    if (!userId || !settings) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '사용자 ID와 설정이 필요합니다'
      });
    }
    
    const result = await rtcService.updateRoomSettings(roomId, userId, settings);
    
    if (!result) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '방 설정을 변경할 권한이 없습니다'
      });
    }
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });
}

module.exports = new RTCController(); 