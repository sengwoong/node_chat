const WebSocket = require('ws');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class SignalingServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.rooms = new Map(); // roomId -> Set of connections
    this.connections = new Map(); // connection -> roomId
    
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      logger.info('새로운 WebRTC 연결:', req.socket.remoteAddress);
      
      // 연결 정보 설정
      ws.isAlive = true;
      ws.roomId = null;
      ws.userId = null;
      
      // 핑퐁으로 연결 상태 확인
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      // 메시지 처리
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          logger.error('메시지 파싱 실패:', error);
          this.sendError(ws, '메시지 형식이 올바르지 않습니다');
        }
      });
      
      // 연결 해제 처리
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
      
      // 에러 처리
      ws.on('error', (error) => {
        logger.error('WebSocket 에러:', error);
        this.handleDisconnect(ws);
      });
    });
    
    // 주기적으로 연결 상태 확인
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          logger.warn('비활성 연결 종료:', ws.userId);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30초마다 확인
  }

  handleMessage(ws, message) {
    const { type, roomId, userId, data } = message;
    
    switch (type) {
      case constants.RTC_EVENTS.JOIN_ROOM:
        this.handleJoinRoom(ws, roomId, userId);
        break;
        
      case constants.RTC_EVENTS.LEAVE_ROOM:
        this.handleLeaveRoom(ws, roomId);
        break;
        
      case constants.RTC_EVENTS.OFFER:
        this.handleOffer(ws, roomId, data);
        break;
        
      case constants.RTC_EVENTS.ANSWER:
        this.handleAnswer(ws, roomId, data);
        break;
        
      case constants.RTC_EVENTS.ICE_CANDIDATE:
        this.handleIceCandidate(ws, roomId, data);
        break;
        
      default:
        logger.warn('알 수 없는 메시지 타입:', type);
        this.sendError(ws, '알 수 없는 메시지 타입입니다');
    }
  }

  handleJoinRoom(ws, roomId, userId) {
    logger.info(`사용자 ${userId}이(가) 방 ${roomId}에 입장했습니다`);
    
    // 기존 방에서 나가기
    if (ws.roomId) {
      this.handleLeaveRoom(ws, ws.roomId);
    }
    
    // 새 방에 입장
    ws.roomId = roomId;
    ws.userId = userId;
    
    // 방 생성 또는 사용자 추가
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    
    this.rooms.get(roomId).add(ws);
    this.connections.set(ws, roomId);
    
    // 방의 다른 사용자들에게 새 사용자 입장 알림
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId: userId,
      roomId: roomId
    }, ws);
    
    // 입장 성공 응답
    this.sendMessage(ws, {
      type: 'join_success',
      roomId: roomId,
      userId: userId,
      participants: this.getRoomParticipants(roomId)
    });
  }

  handleLeaveRoom(ws, roomId) {
    if (!ws.roomId || ws.roomId !== roomId) {
      return;
    }
    
    logger.info(`사용자 ${ws.userId}이(가) 방 ${roomId}에서 나갔습니다`);
    
    // 방에서 사용자 제거
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(ws);
      
      // 방이 비어있으면 방 삭제
      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
        logger.info(`방 ${roomId}이(가) 삭제되었습니다`);
      } else {
        // 다른 사용자들에게 퇴장 알림
        this.broadcastToRoom(roomId, {
          type: 'user_left',
          userId: ws.userId,
          roomId: roomId
        });
      }
    }
    
    // 연결 정보 정리
    this.connections.delete(ws);
    ws.roomId = null;
    ws.userId = null;
  }

  handleOffer(ws, roomId, offer) {
    if (!this.isUserInRoom(ws, roomId)) {
      return;
    }
    
    logger.info(`방 ${roomId}에서 offer 전송: ${ws.userId}`);
    
    // 방의 다른 사용자들에게 offer 전달
    this.broadcastToRoom(roomId, {
      type: constants.RTC_EVENTS.OFFER,
      offer: offer,
      from: ws.userId,
      roomId: roomId
    }, ws);
  }

  handleAnswer(ws, roomId, answer) {
    if (!this.isUserInRoom(ws, roomId)) {
      return;
    }
    
    logger.info(`방 ${roomId}에서 answer 전송: ${ws.userId}`);
    
    // 방의 다른 사용자들에게 answer 전달
    this.broadcastToRoom(roomId, {
      type: constants.RTC_EVENTS.ANSWER,
      answer: answer,
      from: ws.userId,
      roomId: roomId
    }, ws);
  }

  handleIceCandidate(ws, roomId, candidate) {
    if (!this.isUserInRoom(ws, roomId)) {
      return;
    }
    
    logger.debug(`방 ${roomId}에서 ICE candidate 전송: ${ws.userId}`);
    
    // 방의 다른 사용자들에게 ICE candidate 전달
    this.broadcastToRoom(roomId, {
      type: constants.RTC_EVENTS.ICE_CANDIDATE,
      candidate: candidate,
      from: ws.userId,
      roomId: roomId
    }, ws);
  }

  handleDisconnect(ws) {
    if (ws.roomId) {
      this.handleLeaveRoom(ws, ws.roomId);
    }
    
    this.connections.delete(ws);
    logger.info(`WebRTC 연결 종료: ${ws.userId}`);
  }

  // 유틸리티 메서드들
  isUserInRoom(ws, roomId) {
    return ws.roomId === roomId && this.rooms.has(roomId) && this.rooms.get(roomId).has(ws);
  }

  getRoomParticipants(roomId) {
    if (!this.rooms.has(roomId)) {
      return [];
    }
    
    const participants = [];
    this.rooms.get(roomId).forEach(ws => {
      if (ws.userId) {
        participants.push(ws.userId);
      }
    });
    
    return participants;
  }

  broadcastToRoom(roomId, message, excludeWs = null) {
    if (!this.rooms.has(roomId)) {
      return;
    }
    
    this.rooms.get(roomId).forEach(ws => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.sendMessage(ws, {
      type: 'error',
      message: error
    });
  }

  // 서버 상태 조회
  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.keys()).map(roomId => ({
        roomId,
        participants: this.getRoomParticipants(roomId).length
      }))
    };
  }
}

module.exports = SignalingServer; 