const { getPool } = require('../config/db');
const logger = require('../utils/logger');

class CourseModel {
  // 온라인 강의 생성
  async createCourse(courseData) {
    const pool = getPool();
    const { 
      title, description, teacher_id, subject, level = 'beginner', 
      price = 0.00, duration, thumbnail, video_url, preview_url 
    } = courseData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO online_courses (title, description, teacher_id, subject, level, price, 
         duration, thumbnail, video_url, preview_url, status, view_count, rating, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 0, 0.00, NOW(), NOW())`,
        [title, description, teacher_id, subject, level, price, duration, thumbnail, video_url, preview_url]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('온라인 강의 생성 실패:', error);
      throw error;
    }
  }

  // 온라인 강의 목록 조회
  async getCourses(filters = {}) {
    const pool = getPool();
    const { page = 1, limit = 20, subject, level, teacher_id, status = 'published', search } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT c.*, u.name as teacher_name, u.username as teacher_username
        FROM online_courses c
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
      let countQuery = 'SELECT COUNT(*) as total FROM online_courses c WHERE c.status = ?';
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
        courses: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      logger.error('온라인 강의 목록 조회 실패:', error);
      throw error;
    }
  }

  // 온라인 강의 상세 정보 조회
  async getCourseById(courseId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, u.name as teacher_name, u.username as teacher_username, u.bio as teacher_bio
         FROM online_courses c
         LEFT JOIN users u ON c.teacher_id = u.id
         WHERE c.id = ?`,
        [courseId]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('온라인 강의 상세 조회 실패:', error);
      throw error;
    }
  }

  // 온라인 강의 업데이트
  async updateCourse(courseId, updateData) {
    const pool = getPool();
    const { 
      title, description, subject, level, price, duration, 
      thumbnail, video_url, preview_url, status 
    } = updateData;
    
    try {
      const [result] = await pool.execute(
        `UPDATE online_courses SET title = ?, description = ?, subject = ?, level = ?, 
         price = ?, duration = ?, thumbnail = ?, video_url = ?, preview_url = ?, 
         status = ?, updated_at = NOW() WHERE id = ?`,
        [title, description, subject, level, price, duration, thumbnail, 
         video_url, preview_url, status, courseId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('온라인 강의 업데이트 실패:', error);
      throw error;
    }
  }

  // 온라인 강의 삭제
  async deleteCourse(courseId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'DELETE FROM online_courses WHERE id = ?',
        [courseId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('온라인 강의 삭제 실패:', error);
      throw error;
    }
  }

  // 강사별 온라인 강의 목록 조회
  async getCoursesByTeacher(teacherId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM online_courses WHERE teacher_id = ? ORDER BY created_at DESC',
        [teacherId]
      );
      
      return rows;
    } catch (error) {
      logger.error('강사별 온라인 강의 조회 실패:', error);
      throw error;
    }
  }

  // 조회수 증가
  async incrementViewCount(courseId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE online_courses SET view_count = view_count + 1 WHERE id = ?',
        [courseId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('조회수 증가 실패:', error);
      throw error;
    }
  }

  // 평점 업데이트
  async updateRating(courseId, newRating) {
    const pool = getPool();
    
    try {
      // 기존 평점과 새로운 평점을 계산하여 업데이트
      const [result] = await pool.execute(
        'UPDATE online_courses SET rating = ? WHERE id = ?',
        [newRating, courseId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('평점 업데이트 실패:', error);
      throw error;
    }
  }

  // 온라인 강의 통계 조회
  async getCourseStats() {
    const pool = getPool();
    
    try {
      const [stats] = await pool.execute(`
        SELECT 
          (SELECT COUNT(*) FROM online_courses WHERE status = 'published') as published_courses,
          (SELECT COUNT(*) FROM online_courses WHERE status = 'draft') as draft_courses,
          (SELECT COUNT(*) FROM online_courses WHERE status = 'archived') as archived_courses,
          (SELECT COUNT(*) FROM online_courses) as total_courses,
          (SELECT SUM(view_count) FROM online_courses WHERE status = 'published') as total_views,
          (SELECT AVG(rating) FROM online_courses WHERE status = 'published' AND rating > 0) as avg_rating
      `);
      
      return stats[0] || null;
    } catch (error) {
      logger.error('온라인 강의 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = CourseModel; 