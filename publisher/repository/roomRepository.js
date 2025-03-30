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

  async createRoom(name) {
    const pool = getPool();
    try {
      await pool.execute('INSERT INTO chatting.room(name) VALUES(?)', [name]);
      return true;
    } catch (error) {
      console.error('채팅방 생성 실패:', error);
      throw error;
    }
  }

  async getRoom(name) {
    const pool = getPool();
    try {
      const [rows] = await pool.query('SELECT * FROM chatting.room WHERE name = ?', [name]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('채팅방 조회 실패:', error);
      throw error;
    }
  }

  async getChatList(roomName) {
    const pool = getPool();
    try {
      const [rows] = await pool.query(
        'SELECT * FROM chatting.chat WHERE room = ? ORDER BY id DESC LIMIT 50',
        [roomName]
      );
      return rows;
    } catch (error) {
      console.error('채팅 목록 조회 실패:', error);
      throw error;
    }
  }

  async setServerInfo(ip, available) {
    const pool = getPool();
    try {
      await pool.execute(
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

  async insertChat(name, message, roomName) {
    const pool = getPool();
    try {
      await pool.query(
        'INSERT INTO chatting.chat(room, name, message) VALUES(?, ?, ?)',
        [roomName, name, message]
      );
      console.log('채팅 저장됨:', name, message, roomName);
      return true;
    } catch (error) {
      console.error('채팅 저장 실패:', error);
      throw error;
    }
  }

  async deleteRoom(name) {
    const pool = getPool();
    try {
      // 관련 채팅 기록 먼저 삭제
      await pool.query('DELETE FROM chatting.chat WHERE room = ?', [name]);
      
      // 채팅방 삭제
      await pool.query('DELETE FROM chatting.room WHERE name = ?', [name]);
      
      return true;
    } catch (error) {
      console.error('채팅방 삭제 실패:', error);
      throw error;
    }
  }
}

module.exports = new RoomRepository(); 