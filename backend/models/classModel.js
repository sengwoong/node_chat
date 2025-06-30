const { getPool } = require('../config/db');
const logger = require('../utils/logger');

class ClassModel {
  // 오프라인 강의 생성
  async createClass(classData) {
    const pool = getPool();
    const { 
      title, description, teacher_id, subject, level = 'beginner', 
      max_students = 30, price = 0.00, location, schedule, start_date, end_date 
    } = classData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO classes (title, description, teacher_id, subject, level, max_students, 
         current_students, price, location, schedule, start_date, end_date, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [title, description, teacher_id, subject, level, max_students, price, location, schedule, start_date, end_date]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('오프라인 강의 생성 실패:', error);
      throw error;
    }
  }

  // 오프라인 강의 목록 조회
  async getClasses(filters = {}) {
    const pool = getPool();
    const { page = 1, limit = 20, subject, level, teacher_id, status = 'active', search } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT c.*, u.name as teacher_name, u.username as teacher_username
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        WHERE c.status = ?
      `;
      const params = [status];
      
      if (subject) {
        query += ' AND c.subject = ?';
        params.push(subject);
      }
      
      if (level) {
        query += ' AND c.level = ?';
        params.push(level);
      }
      
      if (teacher_id) {
        query += ' AND c.teacher_id = ?';
        params.push(teacher_id);
      }
      
      if (search) {
        query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // 전체 개수 조회
      let countQuery = 'SELECT COUNT(*) as total FROM classes c WHERE c.status = ?';
      const countParams = [status];
      
      if (subject) {
        countQuery += ' AND c.subject = ?';
        countParams.push(subject);
      }
      
      if (level) {
        countQuery += ' AND c.level = ?';
        countParams.push(level);
      }
      
      if (teacher_id) {
        countQuery += ' AND c.teacher_id = ?';
        countParams.push(teacher_id);
      }
      
      if (search) {
        countQuery += ' AND (c.title LIKE ? OR c.description LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      
      return {
        classes: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      logger.error('오프라인 강의 목록 조회 실패:', error);
      throw error;
    }
  }

  // 오프라인 강의 상세 정보 조회
  async getClassById(classId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, u.name as teacher_name, u.username as teacher_username, u.bio as teacher_bio
         FROM classes c
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.id = ?`,
        [classId]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('오프라인 강의 상세 조회 실패:', error);
      throw error;
    }
  }

  // 오프라인 강의 업데이트
  async updateClass(classId, updateData) {
    const pool = getPool();
    const { 
      title, description, subject, level, max_students, price, 
      location, schedule, start_date, end_date, status 
    } = updateData;
    
    try {
      const [result] = await pool.execute(
        `UPDATE classes SET title = ?, description = ?, subject = ?, level = ?, 
         max_students = ?, price = ?, location = ?, schedule = ?, start_date = ?, 
         end_date = ?, status = ?, updated_at = NOW() WHERE id = ?`,
        [title, description, subject, level, max_students, price, location, 
         schedule, start_date, end_date, status, classId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('오프라인 강의 업데이트 실패:', error);
      throw error;
    }
  }

  // 오프라인 강의 삭제
  async deleteClass(classId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'DELETE FROM classes WHERE id = ?',
        [classId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('오프라인 강의 삭제 실패:', error);
      throw error;
    }
  }

  // 강사별 오프라인 강의 목록 조회
  async getClassesByTeacher(teacherId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC',
        [teacherId]
      );
      
      return rows;
    } catch (error) {
      logger.error('강사별 오프라인 강의 조회 실패:', error);
      throw error;
    }
  }

  // 학생 등록 시 현재 학생 수 증가
  async incrementCurrentStudents(classId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE classes SET current_students = current_students + 1 WHERE id = ?',
        [classId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('현재 학생 수 증가 실패:', error);
      throw error;
    }
  }

  // 학생 등록 취소 시 현재 학생 수 감소
  async decrementCurrentStudents(classId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE classes SET current_students = GREATEST(current_students - 1, 0) WHERE id = ?',
        [classId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('현재 학생 수 감소 실패:', error);
      throw error;
    }
  }

  // 오프라인 강의 통계 조회
  async getClassStats() {
    const pool = getPool();
    
    try {
      const [stats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM classes WHERE status = 'active') as active_classes,
          (SELECT COUNT(*) FROM classes WHERE status = 'completed') as completed_classes,
          (SELECT COUNT(*) FROM classes WHERE status = 'cancelled') as cancelled_classes,
          (SELECT COUNT(*) FROM classes) as total_classes,
          (SELECT SUM(current_students) FROM classes WHERE status = 'active') as total_enrolled_students
      `);
      
      return stats[0] || null;
    } catch (error) {
      logger.error('오프라인 강의 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = ClassModel; 