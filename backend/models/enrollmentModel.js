const { getPool } = require('../config/db');
const logger = require('../utils/logger');

class EnrollmentModel {
  // 수강 등록
  async createEnrollment(enrollmentData) {
    const pool = getPool();
    const { user_id, class_id, course_id, status = 'active', progress = 0.00 } = enrollmentData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO enrollments (user_id, class_id, course_id, status, progress, enrolled_at) 
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [user_id, class_id, course_id, status, progress]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('수강 등록 실패:', error);
      throw error;
    }
  }

  // 수강 목록 조회
  async getEnrollments(filters = {}) {
    const pool = getPool();
    const { page = 1, limit = 20, user_id, class_id, course_id, status } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT e.*, 
               u.name as student_name, u.username as student_username,
               c.title as class_title, c.subject as class_subject,
               oc.title as course_title, oc.subject as course_subject
        FROM enrollments e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN classes c ON e.class_id = c.id
        LEFT JOIN online_courses oc ON e.course_id = oc.id
        WHERE 1=1
      `;
      const params = [];
      
      if (user_id) {
        query += ' AND e.user_id = ?';
        params.push(user_id);
      }
      
      if (class_id) {
        query += ' AND e.class_id = ?';
        params.push(class_id);
      }
      
      if (course_id) {
        query += ' AND e.course_id = ?';
        params.push(course_id);
      }
      
      if (status) {
        query += ' AND e.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY e.enrolled_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // 전체 개수 조회
      let countQuery = 'SELECT COUNT(*) as total FROM enrollments e WHERE 1=1';
      const countParams = [];
      
      if (user_id) {
        countQuery += ' AND e.user_id = ?';
        countParams.push(user_id);
      }
      
      if (class_id) {
        countQuery += ' AND e.class_id = ?';
        countParams.push(class_id);
      }
      
      if (course_id) {
        countQuery += ' AND e.course_id = ?';
        countParams.push(course_id);
      }
      
      if (status) {
        countQuery += ' AND e.status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      
      return {
        enrollments: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      logger.error('수강 목록 조회 실패:', error);
      throw error;
    }
  }

  // 수강 상세 정보 조회
  async getEnrollmentById(enrollmentId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, 
               u.name as student_name, u.username as student_username,
               c.title as class_title, c.subject as class_subject,
               oc.title as course_title, oc.subject as course_subject
         FROM enrollments e
         LEFT JOIN users u ON e.user_id = u.id
         LEFT JOIN classes c ON e.class_id = c.id
         LEFT JOIN online_courses oc ON e.course_id = oc.id
         WHERE e.id = ?`,
        [enrollmentId]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('수강 상세 조회 실패:', error);
      throw error;
    }
  }

  // 사용자별 수강 목록 조회
  async getEnrollmentsByUser(userId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, 
               c.title as class_title, c.subject as class_subject, c.location, c.schedule,
               oc.title as course_title, oc.subject as course_subject, oc.duration, oc.thumbnail
         FROM enrollments e
         LEFT JOIN classes c ON e.class_id = c.id
         LEFT JOIN online_courses oc ON e.course_id = oc.id
         WHERE e.user_id = ? AND e.status = 'active'
         ORDER BY e.enrolled_at DESC`,
        [userId]
      );
      
      return rows;
    } catch (error) {
      logger.error('사용자별 수강 목록 조회 실패:', error);
      throw error;
    }
  }

  // 강의별 수강생 목록 조회
  async getEnrollmentsByClass(classId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.name as student_name, u.username as student_username, u.email
         FROM enrollments e
         LEFT JOIN users u ON e.user_id = u.id
         WHERE e.class_id = ? AND e.status = 'active'
         ORDER BY e.enrolled_at ASC`,
        [classId]
      );
      
      return rows;
    } catch (error) {
      logger.error('강의별 수강생 목록 조회 실패:', error);
      throw error;
    }
  }

  // 온라인 강의별 수강생 목록 조회
  async getEnrollmentsByCourse(courseId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT e.*, u.name as student_name, u.username as student_username, u.email
         FROM enrollments e
         LEFT JOIN users u ON e.user_id = u.id
         WHERE e.course_id = ? AND e.status = 'active'
         ORDER BY e.enrolled_at ASC`,
        [courseId]
      );
      
      return rows;
    } catch (error) {
      logger.error('온라인 강의별 수강생 목록 조회 실패:', error);
      throw error;
    }
  }

  // 수강 상태 업데이트
  async updateEnrollmentStatus(enrollmentId, status) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE enrollments SET status = ? WHERE id = ?',
        [status, enrollmentId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('수강 상태 업데이트 실패:', error);
      throw error;
    }
  }

  // 수강 진행률 업데이트
  async updateProgress(enrollmentId, progress) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE enrollments SET progress = ? WHERE id = ?',
        [progress, enrollmentId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('수강 진행률 업데이트 실패:', error);
      throw error;
    }
  }

  // 수강 취소
  async cancelEnrollment(enrollmentId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE enrollments SET status = "cancelled" WHERE id = ?',
        [enrollmentId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('수강 취소 실패:', error);
      throw error;
    }
  }

  // 수강 완료
  async completeEnrollment(enrollmentId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE enrollments SET status = "completed", progress = 100.00 WHERE id = ?',
        [enrollmentId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('수강 완료 실패:', error);
      throw error;
    }
  }

  // 중복 수강 확인
  async checkDuplicateEnrollment(userId, classId, courseId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM enrollments WHERE user_id = ? AND class_id = ? AND course_id = ? AND status = "active"',
        [userId, classId, courseId]
      );
      
      return rows.length > 0;
    } catch (error) {
      logger.error('중복 수강 확인 실패:', error);
      throw error;
    }
  }

  // 수강 통계 조회
  async getEnrollmentStats() {
    const pool = getPool();
    
    try {
      const [stats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM enrollments WHERE status = 'active') as active_enrollments,
          (SELECT COUNT(*) FROM enrollments WHERE status = 'completed') as completed_enrollments,
          (SELECT COUNT(*) FROM enrollments WHERE status = 'cancelled') as cancelled_enrollments,
          (SELECT COUNT(*) FROM enrollments) as total_enrollments,
          (SELECT AVG(progress) FROM enrollments WHERE status = 'active') as avg_progress
      `);
      
      return stats[0] || null;
    } catch (error) {
      logger.error('수강 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = EnrollmentModel; 