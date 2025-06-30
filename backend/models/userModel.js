const { getPool } = require('../config/db');
const logger = require('../utils/logger');

class UserModel {
  // 사용자 생성
  async createUser(userData) {
    const pool = getPool();
    const { username, email, password, name, role = 'student', bio, phone } = userData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO users (username, email, password, name, role, bio, phone, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [username, email, password, name, role, bio, phone]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('사용자 생성 실패:', error);
      throw error;
    }
  }

  // 사용자 목록 조회
  async getUsers(filters = {}) {
    const pool = getPool();
    const { page = 1, limit = 20, role, search } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = 'SELECT id, username, email, name, role, bio, phone, created_at, updated_at FROM users WHERE 1=1';
      const params = [];
      
      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }
      
      if (search) {
        query += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // 전체 개수 조회
      let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      const countParams = [];
      
      if (role) {
        countQuery += ' AND role = ?';
        countParams.push(role);
      }
      
      if (search) {
        countQuery += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      
      return {
        users: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      logger.error('사용자 목록 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 상세 정보 조회
  async getUserById(userId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, name, role, bio, phone, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('사용자 상세 조회 실패:', error);
      throw error;
    }
  }

  // 사용자명으로 조회
  async getUserByUsername(username) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('사용자명으로 조회 실패:', error);
      throw error;
    }
  }

  // 이메일로 조회
  async getUserByEmail(email) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('이메일로 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 정보 업데이트
  async updateUser(userId, updateData) {
    const pool = getPool();
    const { name, bio, phone, profile_image } = updateData;
    
    try {
      const [result] = await pool.execute(
        `UPDATE users SET name = ?, bio = ?, phone = ?, profile_image = ?, updated_at = NOW() 
         WHERE id = ?`,
        [name, bio, phone, profile_image, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('사용자 정보 업데이트 실패:', error);
      throw error;
    }
  }

  // 비밀번호 변경
  async updatePassword(userId, newPassword) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [newPassword, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('비밀번호 변경 실패:', error);
      throw error;
    }
  }

  // 사용자 삭제
  async deleteUser(userId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('사용자 삭제 실패:', error);
      throw error;
    }
  }

  // 강사 목록 조회
  async getTeachers() {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, name, bio, created_at FROM users WHERE role = "teacher" ORDER BY name'
      );
      
      return rows;
    } catch (error) {
      logger.error('강사 목록 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 통계 조회
  async getUserStats() {
    const pool = getPool();
    
    try {
      const [stats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
          (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
          (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
          (SELECT COUNT(*) FROM users) as total_users
      `);
      
      return stats[0] || null;
    } catch (error) {
      logger.error('사용자 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = UserModel; 