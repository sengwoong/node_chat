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
}

module.exports = new RoomService(); 