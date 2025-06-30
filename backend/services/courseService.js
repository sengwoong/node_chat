const { OnlineCourse, User, Enrollment } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class CourseService {
  /**
   * 코스 목록 조회
   */
  async getCourses(filters = {}) {
    try {
      const { page = 1, limit = 20, subject, level, teacher_id, status = 'published', search } = filters;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      if (subject) whereClause.subject = subject;
      if (level) whereClause.level = level;
      if (teacher_id) whereClause.teacher_id = teacher_id;
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await OnlineCourse.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username', 'bio']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        courses: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('온라인 강의 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 생성
   */
  async createCourse(courseData) {
    try {
      // 필수 필드 검증
      const requiredFields = ['title', 'description', 'teacher_id', 'subject'];
      for (const field of requiredFields) {
        if (!courseData[field]) {
          throw new Error(`${field} 필드는 필수입니다.`);
        }
      }

      // 가격 유효성 검증
      if (courseData.price && courseData.price < 0) {
        throw new Error('가격은 0 이상이어야 합니다.');
      }

      const newCourse = await OnlineCourse.create(courseData);
      logger.info(`새로운 코스가 생성되었습니다: ${newCourse.id}`);
      
      return newCourse.toJSON();
    } catch (error) {
      logger.error('코스 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 ID로 조회
   */
  async getCourseById(courseId) {
    try {
      const courseData = await OnlineCourse.findByPk(courseId, {
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username', 'bio']
        }]
      });
      
      if (!courseData) {
        throw new Error('코스를 찾을 수 없습니다.');
      }
      
      return courseData.toJSON();
    } catch (error) {
      logger.error('코스 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 정보 수정
   */
  async updateCourse(courseId, updateData) {
    try {
      // 가격 유효성 검증
      if (updateData.price !== undefined && updateData.price < 0) {
        throw new Error('가격은 0 이상이어야 합니다.');
      }

      const [updatedRows] = await OnlineCourse.update(updateData, {
        where: { id: courseId }
      });
      
      if (updatedRows === 0) {
        throw new Error('코스를 찾을 수 없습니다.');
      }

      const updatedCourse = await this.getCourseById(courseId);
      logger.info(`코스가 수정되었습니다: ${courseId}`);
      return updatedCourse;
    } catch (error) {
      logger.error('코스 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 삭제
   */
  async deleteCourse(courseId) {
    try {
      const result = await OnlineCourse.destroy({
        where: { id: courseId }
      });
      
      if (result === 0) {
        throw new Error('코스를 찾을 수 없습니다.');
      }

      logger.info(`코스가 삭제되었습니다: ${courseId}`);
      return true;
    } catch (error) {
      logger.error('코스 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 강사별 코스 목록 조회
   */
  async getCoursesByTeacher(teacherId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await OnlineCourse.findAndCountAll({
        where: { teacher_id: teacherId },
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        courses: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('강사별 코스 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 조회수 증가
   */
  async incrementViewCount(courseId) {
    try {
      await OnlineCourse.increment('view_count', {
        where: { id: courseId }
      });
      
      logger.info(`코스 조회수 증가: ${courseId}`);
      return true;
    } catch (error) {
      logger.error('조회수 증가 실패:', error);
      throw error;
    }
  }

  /**
   * 평점 업데이트
   */
  async updateRating(courseId, newRating) {
    try {
      await OnlineCourse.update(
        { rating: newRating },
        { where: { id: courseId } }
      );
      
      logger.info(`코스 평점 업데이트: ${courseId} -> ${newRating}`);
      return true;
    } catch (error) {
      logger.error('평점 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 통계 조회
   */
  async getCourseStats() {
    try {
      const totalCourses = await OnlineCourse.count();
      const publishedCourses = await OnlineCourse.count({ where: { status: 'published' } });
      const draftCourses = await OnlineCourse.count({ where: { status: 'draft' } });
      const archivedCourses = await OnlineCourse.count({ where: { status: 'archived' } });
      
      const totalViewsResult = await OnlineCourse.sum('view_count');
      const avgRatingResult = await OnlineCourse.findOne({
        attributes: [[OnlineCourse.sequelize.fn('AVG', OnlineCourse.sequelize.col('rating')), 'avgRating']],
        where: { rating: { [Op.gt]: 0 } }
      });
      
      return {
        total_courses: totalCourses,
        published_courses: publishedCourses,
        draft_courses: draftCourses,
        archived_courses: archivedCourses,
        total_views: totalViewsResult || 0,
        avg_rating: avgRatingResult?.dataValues?.avgRating || 0
      };
    } catch (error) {
      logger.error('코스 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 인기 코스 조회
   */
  async getPopularCourses(limit = 10) {
    try {
      const popularCourses = await OnlineCourse.findAll({
        where: { status: 'published' },
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username']
        }],
        order: [['view_count', 'DESC']],
        limit: parseInt(limit)
      });
      
      return popularCourses;
    } catch (error) {
      logger.error('인기 코스 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = new CourseService(); 