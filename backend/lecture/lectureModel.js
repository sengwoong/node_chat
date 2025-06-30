const { getPool } = require('../config/db');
const logger = require('../utils/logger');

class LectureModel {
  // 강의 생성
  async createLecture(lectureData) {
    const pool = getPool();
    const { title, description, instructorId, category, status, thumbnail, videoUrl } = lectureData;
    
    try {
      const [result] = await pool.execute(
        `INSERT INTO lectures (title, description, instructor_id, category, status, thumbnail, video_url, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [title, description, instructorId, category, status, thumbnail, videoUrl]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('강의 생성 실패:', error);
      throw error;
    }
  }

  // 강의 목록 조회
  async getLectureList(filters = {}) {
    const pool = getPool();
    const { page = 1, limit = 10, category, status, instructorId, search } = filters;
    const offset = (page - 1) * limit;
    
    try {
      let query = `
        SELECT l.*, u.name as instructor_name, u.email as instructor_email
        FROM lectures l
        LEFT JOIN users u ON l.instructor_id = u.id
        WHERE 1=1
      `;
      const params = [];
      
      if (category) {
        query += ' AND l.category = ?';
        params.push(category);
      }
      
      if (status) {
        query += ' AND l.status = ?';
        params.push(status);
      }
      
      if (instructorId) {
        query += ' AND l.instructor_id = ?';
        params.push(instructorId);
      }
      
      if (search) {
        query += ' AND (l.title LIKE ? OR l.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }
      
      query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [rows] = await pool.execute(query, params);
      
      // 전체 개수 조회
      let countQuery = `
        SELECT COUNT(*) as total
        FROM lectures l
        WHERE 1=1
      `;
      const countParams = [];
      
      if (category) {
        countQuery += ' AND l.category = ?';
        countParams.push(category);
      }
      
      if (status) {
        countQuery += ' AND l.status = ?';
        countParams.push(status);
      }
      
      if (instructorId) {
        countQuery += ' AND l.instructor_id = ?';
        countParams.push(instructorId);
      }
      
      if (search) {
        countQuery += ' AND (l.title LIKE ? OR l.description LIKE ?)';
        countParams.push(`%${search}%`, `%${search}%`);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      
      return {
        lectures: rows,
        total: countResult[0].total,
        page,
        limit,
        totalPages: Math.ceil(countResult[0].total / limit)
      };
    } catch (error) {
      logger.error('강의 목록 조회 실패:', error);
      throw error;
    }
  }

  // 강의 상세 정보 조회
  async getLectureById(lectureId) {
    const pool = getPool();
    
    try {
      const [rows] = await pool.execute(
        `SELECT l.*, u.name as instructor_name, u.email as instructor_email
         FROM lectures l
         LEFT JOIN users u ON l.instructor_id = u.id
         WHERE l.id = ?`,
        [lectureId]
      );
      
      return rows[0] || null;
    } catch (error) {
      logger.error('강의 상세 조회 실패:', error);
      throw error;
    }
  }

  // 강의 업데이트
  async updateLecture(lectureId, updateData) {
    const pool = getPool();
    const { title, description, category, status, thumbnail, videoUrl } = updateData;
    
    try {
      const [result] = await pool.execute(
        `UPDATE lectures 
         SET title = ?, description = ?, category = ?, status = ?, thumbnail = ?, video_url = ?, updated_at = NOW()
         WHERE id = ?`,
        [title, description, category, status, thumbnail, videoUrl, lectureId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('강의 업데이트 실패:', error);
      throw error;
    }
  }

  // 강의 삭제
  async deleteLecture(lectureId) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'DELETE FROM lectures WHERE id = ?',
        [lectureId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('강의 삭제 실패:', error);
      throw error;
    }
  }

  // 강의 상태 변경
  async updateLectureStatus(lectureId, status) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'UPDATE lectures SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, lectureId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('강의 상태 변경 실패:', error);
      throw error;
    }
  }

  // 강의 조회수 증가
  async incrementViewCount(lectureId) {
    const pool = getPool();
    
    try {
      await pool.execute(
        'UPDATE lectures SET view_count = view_count + 1 WHERE id = ?',
        [lectureId]
      );
    } catch (error) {
      logger.error('강의 조회수 증가 실패:', error);
      throw error;
    }
  }

  // 강의 좋아요/싫어요
  async toggleLike(lectureId, userId, isLike) {
    const pool = getPool();
    
    try {
      // 기존 좋아요/싫어요 확인
      const [existing] = await pool.execute(
        'SELECT * FROM lecture_reactions WHERE lecture_id = ? AND user_id = ?',
        [lectureId, userId]
      );
      
      if (existing.length > 0) {
        // 기존 반응이 있으면 업데이트
        await pool.execute(
          'UPDATE lecture_reactions SET is_like = ?, updated_at = NOW() WHERE lecture_id = ? AND user_id = ?',
          [isLike, lectureId, userId]
        );
      } else {
        // 새로운 반응 추가
        await pool.execute(
          'INSERT INTO lecture_reactions (lecture_id, user_id, is_like, created_at) VALUES (?, ?, ?, NOW())',
          [lectureId, userId, isLike]
        );
      }
      
      // 강의의 좋아요/싫어요 수 업데이트
      const [likes] = await pool.execute(
        'SELECT COUNT(*) as count FROM lecture_reactions WHERE lecture_id = ? AND is_like = 1',
        [lectureId]
      );
      
      const [dislikes] = await pool.execute(
        'SELECT COUNT(*) as count FROM lecture_reactions WHERE lecture_id = ? AND is_like = 0',
        [lectureId]
      );
      
      await pool.execute(
        'UPDATE lectures SET like_count = ?, dislike_count = ? WHERE id = ?',
        [likes[0].count, dislikes[0].count, lectureId]
      );
      
      return { likes: likes[0].count, dislikes: dislikes[0].count };
    } catch (error) {
      logger.error('강의 좋아요/싫어요 처리 실패:', error);
      throw error;
    }
  }

  // 강의 댓글 추가
  async addComment(lectureId, userId, content) {
    const pool = getPool();
    
    try {
      const [result] = await pool.execute(
        'INSERT INTO lecture_comments (lecture_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())',
        [lectureId, userId, content]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('강의 댓글 추가 실패:', error);
      throw error;
    }
  }

  // 강의 댓글 목록 조회
  async getComments(lectureId, page = 1, limit = 20) {
    const pool = getPool();
    const offset = (page - 1) * limit;
    
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, u.name as user_name, u.email as user_email
         FROM lecture_comments c
         LEFT JOIN users u ON c.user_id = u.id
         WHERE c.lecture_id = ?
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [lectureId, limit, offset]
      );
      
      return rows;
    } catch (error) {
      logger.error('강의 댓글 목록 조회 실패:', error);
      throw error;
    }
  }

  // 강의 통계 조회
  async getLectureStats(lectureId) {
    const pool = getPool();
    
    try {
      const [stats] = await pool.execute(
        `SELECT 
           view_count,
           like_count,
           dislike_count,
           (SELECT COUNT(*) FROM lecture_comments WHERE lecture_id = ?) as comment_count
         FROM lectures 
         WHERE id = ?`,
        [lectureId, lectureId]
      );
      
      return stats[0] || null;
    } catch (error) {
      logger.error('강의 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = new LectureModel(); 