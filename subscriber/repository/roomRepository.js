const { getPool } = require('../config/database');

class RoomRepository {
  async getRoomList() {
    const pool = getPool();
    try {
      const [rows] = await pool.query('SELECT * FROM chatting.room');
      return rows;
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error);
      throw error;
    }
  }

  async insertChat(user, message, roomName) {
    const pool = getPool();
    try {
      await pool.query(
        'INSERT INTO chatting.chat(room, name, message) VALUES(?, ?, ?)',
        [roomName, user, message]
      );
      console.log('채팅 저장됨:', user, message, roomName);
      return true;
    } catch (error) {
      console.error('채팅 저장 실패:', error);
      throw error;
    }
  }

  async setServerInfo(ip, available) {
    const pool = getPool();
    try {
      await pool.query(
        "INSERT INTO serverInfo(`ip`, `available`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `available` = VALUES(`available`)",
        [ip, available]
      );
      return true;
    } catch (error) {
      console.error('서버 정보 설정 실패:', error);
      throw error;
    }
  }

  async getAvailableServers() {
    const pool = getPool();
    try {
      const [rows] = await pool.query('SELECT * FROM chatting.serverInfo WHERE available = 1');
      return rows;
    } catch (error) {
      console.error('가용 서버 목록 조회 실패:', error);
      throw error;
    }
  }

  async createRoom(name) {
    const pool = getPool();
    try {
      await pool.execute('INSERT INTO chatting.room(name) VALUES(?)', [name]);
      console.log('채팅방 생성됨 (Subscriber):', name);
      return true;
    } catch (error) {
      console.error('채팅방 생성 실패 (Subscriber):', error);
      throw error;
    }
  }

  async deleteRoom(name) {
    const pool = getPool();
    try {
      await pool.query('DELETE FROM chatting.chat WHERE room = ?', [name]);
      
      await pool.query('DELETE FROM chatting.room WHERE name = ?', [name]);
      
      console.log('채팅방 삭제됨 (Subscriber):', name);
      return true;
    } catch (error) {
      console.error('채팅방 삭제 실패 (Subscriber):', error);
      throw error;
    }
  }
}

module.exports = new RoomRepository(); 