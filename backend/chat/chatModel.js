const { getPool } = require('../config/db');
const logger = require('../utils/logger');

class ChatModel {
  // 채팅방 생성
  async createRoom(roomData) {
    const pool = getPool();
    const { name, description, creatorId, isPrivate = false, maxParticipants = 50 } = roomData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO chat_rooms (name, description, creator_id, is_private, max_participants, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, description, creatorId, isPrivate, maxParticipants]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('채팅방 생성 실패:', error);
      throw error;
    }
  }

  // 채팅방 목록 조회
  async getRooms(filters = {}) {
    const pool = getPool();
    const { page = 1, limit = 20, isPrivate = false, search } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT r.*, 
               u.name as creator_name,
               (SELECT COUNT(*) FROM chat_participants WHERE room_id = r.id) as participant_count
        FROM chat_rooms r
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.is_private = ?
      `;
      const params = [isPrivate];
      
      if (search) {
        query += ' AND (r.name LIKE ? OR r.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // 전체 개수 조회
      let countQuery = `
        SELECT COUNT(*) as total
        FROM chat_rooms r
        WHERE r.is_private = ?
      `;
      const countParams = [isPrivate];
      
      if (search) {
        countQuery += ' AND (r.name LIKE ? OR r.description LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      
      return {
        rooms: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      logger.error('채팅방 목록 조회 실패:', error);
      throw error;
    }
  }

  // 채팅방 상세 정보 조회
  async getRoomById(roomId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT r.*, 
               u.name as creator_name,
               (SELECT COUNT(*) FROM chat_participants WHERE room_id = r.id) as participant_count
         FROM chat_rooms r
         LEFT JOIN users u ON r.creator_id = u.id
         WHERE r.id = ?`,
        [roomId]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('채팅방 상세 조회 실패:', error);
      throw error;
    }
  }

  // 채팅방 참가자 추가
  async addParticipant(roomId, userId) {
    const pool = getPool();
    
    try {
      // 이미 참가자인지 확인
      const [existing] = await pool.execute(
        'SELECT * FROM chat_participants WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      // 참가자 추가
      const [result] = await pool.execute(
        'INSERT INTO chat_participants (room_id, user_id, joined_at) VALUES (?, ?, NOW())',
        [roomId, userId]
      );
      
      return { id: result.insertId, room_id: roomId, user_id: userId };
    } catch (error) {
      logger.error('채팅방 참가자 추가 실패:', error);
      throw error;
    }
  }

  // 채팅방 참가자 제거
  async removeParticipant(roomId, userId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'DELETE FROM chat_participants WHERE room_id = ? AND user_id = ?',
        [roomId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('채팅방 참가자 제거 실패:', error);
      throw error;
    }
  }

  // 채팅방 참가자 목록 조회
  async getParticipants(roomId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, u.name as username, u.email as user_email
         FROM chat_participants p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.room_id = ?
         ORDER BY p.joined_at ASC`,
        [roomId]
      );
      
      return rows;
    } catch (error) {
      logger.error('채팅방 참가자 목록 조회 실패:', error);
      throw error;
    }
  }

  // 메시지 저장
  async saveMessage(messageData) {
    const pool = getPool();
    const { roomId, userId, message, messageType = 'text' } = messageData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO chat_messages (room_id, user_id, message, message_type, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [roomId, userId, message, messageType]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('메시지 저장 실패:', error);
      throw error;
    }
  }

  // 메시지 목록 조회
  async getMessages(roomId, filters = {}) {
    const pool = getPool();
    const { page = 1, limit = 50, beforeId } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT m.*, u.name as username, u.email as user_email
        FROM chat_messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.room_id = ?
      `;
      const params = [roomId];
      
      if (beforeId) {
        query += ' AND m.id < ?';
        params.push(beforeId);
      }
      
      query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // 전체 개수 조회
      let countQuery = `
        SELECT COUNT(*) as total
        FROM chat_messages m
        WHERE m.room_id = ?
      `;
      const countParams = [roomId];
      
      if (beforeId) {
        countQuery += ' AND m.id < ?';
        countParams.push(beforeId);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      
      return {
        messages: rows.reverse(), // 최신 메시지가 아래로 오도록
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      logger.error('메시지 목록 조회 실패:', error);
      throw error;
    }
  }

  // 채팅방 삭제
  async deleteRoom(roomId, creatorId) {
    const pool = getPool();
    
    try {
      // 방 생성자만 삭제 가능
      const [result] = await pool.execute(
        'DELETE FROM chat_rooms WHERE id = ? AND creator_id = ?',
        [roomId, creatorId]
      );
      
      if (result.affectedRows > 0) {
        // 관련 데이터도 함께 삭제
        await pool.execute('DELETE FROM chat_participants WHERE room_id = ?', [roomId]);
        await pool.execute('DELETE FROM chat_messages WHERE room_id = ?', [roomId]);
      }
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('채팅방 삭제 실패:', error);
      throw error;
    }
  }

  // 채팅 통계 조회
  async getChatStats() {
    const pool = getPool();
    
    try {
      const [stats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM chat_rooms) as total_rooms,
          (SELECT COUNT(*) FROM chat_messages) as total_messages,
          (SELECT COUNT(DISTINCT user_id) FROM chat_participants) as total_users,
          (SELECT COUNT(*) FROM chat_participants) as total_participations
      `);
      
      return stats[0] || null;
    } catch (error) {
      logger.error('채팅 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = new ChatModel(); 