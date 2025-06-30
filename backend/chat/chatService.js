const chatModel = require('./chatModel');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class ChatService {
  // 채팅방 생성
  async createRoom(roomData) {
    try {
      const roomId = await chatModel.createRoom(roomData);
      const room = await chatModel.getRoomById(roomId);
      
      logger.info(`채팅방 생성 완료: ${room.name} (ID: ${roomId})`);
      return room;
    } catch (error) {
      logger.error('채팅방 생성 서비스 오류:', error);
      throw error;
    }
  }

  // 채팅방 목록 조회
  async getRooms(filters = {}) {
    try {
      const result = await chatModel.getRooms(filters);
      logger.info(`채팅방 목록 조회 완료: ${result.rooms.length}개 방`);
      return result;
    } catch (error) {
      logger.error('채팅방 목록 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 채팅방 상세 정보 조회
  async getRoomById(roomId) {
    try {
      const room = await chatModel.getRoomById(roomId);
      if (!room) {
        throw new Error('채팅방을 찾을 수 없습니다');
      }
      
      logger.info(`채팅방 상세 조회 완료: ${room.name} (ID: ${roomId})`);
      return room;
    } catch (error) {
      logger.error('채팅방 상세 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 채팅방 참가
  async joinRoom(roomId, userId) {
    try {
      // 방 존재 확인
      const room = await chatModel.getRoomById(roomId);
      if (!room) {
        throw new Error('채팅방을 찾을 수 없습니다');
      }

      // 참가자 수 제한 확인
      const participants = await chatModel.getParticipants(roomId);
      if (participants.length >= room.max_participants) {
        throw new Error('채팅방이 가득 찼습니다');
      }

      // 참가자 추가
      const participant = await chatModel.addParticipant(roomId, userId);
      
      logger.info(`채팅방 참가 완료: 사용자 ${userId}가 방 ${roomId}에 참가`);
      return participant;
    } catch (error) {
      logger.error('채팅방 참가 서비스 오류:', error);
      throw error;
    }
  }

  // 채팅방 나가기
  async leaveRoom(roomId, userId) {
    try {
      const result = await chatModel.removeParticipant(roomId, userId);
      
      if (result) {
        logger.info(`채팅방 나가기 완료: 사용자 ${userId}가 방 ${roomId}에서 나감`);
      }
      
      return result;
    } catch (error) {
      logger.error('채팅방 나가기 서비스 오류:', error);
      throw error;
    }
  }

  // 채팅방 참가자 목록 조회
  async getParticipants(roomId) {
    try {
      const participants = await chatModel.getParticipants(roomId);
      logger.info(`채팅방 참가자 목록 조회 완료: 방 ${roomId}, ${participants.length}명`);
      return participants;
    } catch (error) {
      logger.error('채팅방 참가자 목록 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 메시지 목록 조회
  async getMessages(roomId, filters = {}) {
    try {
      const result = await chatModel.getMessages(roomId, filters);
      logger.info(`메시지 목록 조회 완료: 방 ${roomId}, ${result.messages.length}개 메시지`);
      return result;
    } catch (error) {
      logger.error('메시지 목록 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 채팅방 삭제
  async deleteRoom(roomId, creatorId) {
    try {
      const result = await chatModel.deleteRoom(roomId, creatorId);
      
      if (result) {
        logger.info(`채팅방 삭제 완료: 방 ${roomId} (생성자: ${creatorId})`);
      } else {
        throw new Error('채팅방을 삭제할 권한이 없습니다');
      }
      
      return result;
    } catch (error) {
      logger.error('채팅방 삭제 서비스 오류:', error);
      throw error;
    }
  }

  // 채팅 통계 조회
  async getChatStats() {
    try {
      const stats = await chatModel.getChatStats();
      logger.info('채팅 통계 조회 완료');
      return stats;
    } catch (error) {
      logger.error('채팅 통계 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 실시간 메시지 처리 (Socket.IO와 연동)
  async handleRealTimeMessage(socket, messageData) {
    try {
      // DB 저장은 subscriber에서 처리하므로 제거
      // Kafka 발행만 처리
      return {
        ...messageData,
        processed: true
      };
    } catch (error) {
      logger.error('실시간 메시지 처리 오류:', error);
      throw error;
    }
  }
}

module.exports = new ChatService(); 