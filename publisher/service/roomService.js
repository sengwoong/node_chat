const roomRepository = require('../repository/roomRepository');
const { getPool } = require('../config/database');

class RoomService {
  async getRoomList() {
    try {
      return await roomRepository.getRoomList();
    } catch (error) {
      throw error;
    }
  }

  async createRoom(name) {
    try {
      return await roomRepository.createRoom(name);
    } catch (error) {
      throw error;
    }
  }

  async getRoom(name) {
    try {
      return await roomRepository.getRoom(name);
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

  async getChatList(roomName) {
    try {
      return await roomRepository.getChatList(roomName);
    } catch (error) {
      throw error;
    }
  }

  async insertChat(name, message, roomName) {
    try {
      return await roomRepository.insertChat(name, message, roomName);
    } catch (error) {
      throw error;
    }
  }

  async deleteRoom(name) {
    try {
      return await roomRepository.deleteRoom(name);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoomService(); 