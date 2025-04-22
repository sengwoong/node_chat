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

  async createRoom(name, userId) {
    const pool = getPool();
    try {
      await pool.execute('INSERT INTO chatting.room(name, creatorUserId) VALUES(?, ?)', [name, userId]);
      console.log('채팅방 생성됨 (Subscriber):', name, 'by user:', userId);
      return true;
    } catch (error) {
      console.error('채팅방 생성 실패 (Subscriber):', error);
      throw error;
    }
  }

  async deleteRoom(name, userId) {
    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query('SELECT creatorUserId FROM chatting.room WHERE name = ?', [name]);
      
      if (rows.length === 0) {
        throw new Error(`삭제할 방("${name}")을 찾을 수 없습니다.`);
      }
      
      const room = rows[0];
      
      if (room.creatorUserId !== userId) {
          console.warn(`사용자("${userId}")가 방("${name}") 삭제 권한 없음. 생성자: "${room.creatorUserId}"`);
          throw new Error('이 채팅방을 삭제할 권한이 없습니다.');
      }
      
      await connection.query('DELETE FROM chatting.chat WHERE room = ?', [name]);
      
      await connection.query('DELETE FROM chatting.room WHERE name = ?', [name]);
      
      await connection.commit();
      
      console.log('채팅방 삭제됨 (Subscriber):', name, 'by authorized user:', userId);
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('채팅방 삭제 실패 (Subscriber Repository):', error);
      throw error;
    } finally {
        connection.release();
    }
  }
}

module.exports = new RoomRepository(); 