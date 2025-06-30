const logger = require('../utils/logger');
const constants = require('../config/constants');

class RTCService {
  constructor() {
    this.rooms = new Map(); // roomId -> room info
    this.connections = new Map(); // connection -> roomId
  }

  // RTC 방 생성
  async createRoom(roomId, userId, maxParticipants = 10) {
    try {
      if (this.rooms.has(roomId)) {
        throw new Error('이미 존재하는 방입니다');
      }

      const room = {
        id: roomId,
        creator: userId,
        maxParticipants,
        participants: [],
        createdAt: new Date(),
        settings: {
          videoEnabled: true,
          audioEnabled: true,
          screenSharingEnabled: true
        }
      };

      this.rooms.set(roomId, room);
      logger.info(`RTC 방 생성: ${roomId} by ${userId}`);

      return room;
    } catch (error) {
      logger.error('RTC 방 생성 실패:', error);
      throw error;
    }
  }

  // RTC 방 정보 조회
  async getRoomInfo(roomId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return null;
      }

      return {
        ...room,
        participantCount: room.participants.length
      };
    } catch (error) {
      logger.error('RTC 방 정보 조회 실패:', error);
      throw error;
    }
  }

  // RTC 방 목록 조회
  async getRoomList() {
    try {
      const rooms = Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        creator: room.creator,
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt
      }));

      return rooms;
    } catch (error) {
      logger.error('RTC 방 목록 조회 실패:', error);
      throw error;
    }
  }

  // RTC 방 삭제
  async deleteRoom(roomId, userId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return false;
      }

      // 방 생성자만 삭제 가능
      if (room.creator !== userId) {
        return false;
      }

      this.rooms.delete(roomId);
      logger.info(`RTC 방 삭제: ${roomId} by ${userId}`);

      return true;
    } catch (error) {
      logger.error('RTC 방 삭제 실패:', error);
      throw error;
    }
  }

  // RTC 방 참가자 목록 조회
  async getRoomParticipants(roomId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return [];
      }

      return room.participants;
    } catch (error) {
      logger.error('RTC 방 참가자 목록 조회 실패:', error);
      throw error;
    }
  }

  // RTC 서버 상태 조회
  async getServerStats() {
    try {
      const stats = {
        totalRooms: this.rooms.size,
        totalConnections: this.connections.size,
        rooms: Array.from(this.rooms.values()).map(room => ({
          id: room.id,
          participantCount: room.participants.length,
          maxParticipants: room.maxParticipants
        }))
      };

      return stats;
    } catch (error) {
      logger.error('RTC 서버 상태 조회 실패:', error);
      throw error;
    }
  }

  // RTC 연결 토큰 생성 (TURN 서버용)
  async generateConnectionToken(roomId, userId) {
    try {
      // 실제로는 TURN 서버 토큰 생성 로직 구현
      const token = {
        roomId,
        userId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24시간
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      };

      return token;
    } catch (error) {
      logger.error('RTC 연결 토큰 생성 실패:', error);
      throw error;
    }
  }

  // RTC 방 참가 권한 확인
  async checkRoomAccess(roomId, userId) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return false;
      }

      // 방이 가득 찼는지 확인
      if (room.participants.length >= room.maxParticipants) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('RTC 방 참가 권한 확인 실패:', error);
      throw error;
    }
  }

  // RTC 방 설정 업데이트
  async updateRoomSettings(roomId, userId, settings) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return false;
      }

      // 방 생성자만 설정 변경 가능
      if (room.creator !== userId) {
        return false;
      }

      // 설정 업데이트
      room.settings = { ...room.settings, ...settings };
      room.updatedAt = new Date();

      logger.info(`RTC 방 설정 업데이트: ${roomId} by ${userId}`);

      return room;
    } catch (error) {
      logger.error('RTC 방 설정 업데이트 실패:', error);
      throw error;
    }
  }

  // 사용자 방 참가
  async joinRoom(roomId, userId, connection) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        throw new Error('방을 찾을 수 없습니다');
      }

      if (room.participants.length >= room.maxParticipants) {
        throw new Error('방이 가득 찼습니다');
      }

      // 이미 참가 중인지 확인
      const existingParticipant = room.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return room;
      }

      // 참가자 추가
      const participant = {
        userId,
        joinedAt: new Date(),
        connection
      };

      room.participants.push(participant);
      this.connections.set(connection, roomId);

      logger.info(`RTC 방 참가: ${roomId} by ${userId}`);

      return room;
    } catch (error) {
      logger.error('RTC 방 참가 실패:', error);
      throw error;
    }
  }

  // 사용자 방 퇴장
  async leaveRoom(roomId, userId, connection) {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return false;
      }

      // 참가자 제거
      room.participants = room.participants.filter(p => p.userId !== userId);
      this.connections.delete(connection);

      // 방이 비어있으면 방 삭제
      if (room.participants.length === 0) {
        this.rooms.delete(roomId);
        logger.info(`RTC 방 자동 삭제: ${roomId} (참가자 없음)`);
      }

      logger.info(`RTC 방 퇴장: ${roomId} by ${userId}`);

      return true;
    } catch (error) {
      logger.error('RTC 방 퇴장 실패:', error);
      throw error;
    }
  }
}

module.exports = new RTCService(); 