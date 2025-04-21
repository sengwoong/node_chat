const roomRepository = require('../repository/roomRepository');

class RoomService {
  async insertChat(user, message, roomName) {
    try {
      return await roomRepository.insertChat(user, message, roomName);
    } catch (error) {
      throw error;
    }
  }

  async setServerInfo(ip, available) {
    try {
      return await roomRepository.setServerInfo(ip, available);
    } catch (error) {
      throw error;
    }
  }

  async getAvailableServers() {
    try {
      return await roomRepository.getAvailableServers();
    } catch (error) {
      throw error;
    }
  }
  
  // 채팅방 생성 (Kafka에서 이벤트를 받아 처리)
  async createRoom(name) {
    try {
      // Repository를 통해 DB에 채팅방 생성
      return await roomRepository.createRoom(name);
    } catch (error) {
      console.error('채팅방 생성 실패 (Subscriber):', error);
      throw error;
    }
  }
  
  // 채팅방 삭제 (Kafka에서 이벤트를 받아 처리)
  async deleteRoom(name) {
    try {
      // Repository를 통해 DB에서 채팅방 삭제
      return await roomRepository.deleteRoom(name);
    } catch (error) {
      console.error('채팅방 삭제 실패 (Subscriber):', error);
      throw error;
    }
  }
}

module.exports = new RoomService(); 