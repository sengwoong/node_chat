const { Enrollment, User, Class, OnlineCourse } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class EnrollmentService {
  /**
   * 수강신청 목록 조회
   */
  async getEnrollments(filters = {}) {
    try {
      const { page = 1, limit = 20, user_id, class_id, course_id, status } = filters;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      if (user_id) whereClause.user_id = user_id;
      if (class_id) whereClause.class_id = class_id;
      if (course_id) whereClause.course_id = course_id;
      if (status) whereClause.status = status;

      const { count, rows } = await Enrollment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'title', 'category'],
            required: false
          },
          {
            model: OnlineCourse,
            as: 'course',
            attributes: ['id', 'title', 'subject'],
            required: false
          }
        ],
        order: [['enrolled_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        enrollments: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('수강신청 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 수강신청 생성
   */
  async createEnrollment(enrollmentData) {
    try {
      // 필수 필드 검증
      if (!enrollmentData.user_id) {
        throw new Error('사용자 ID는 필수입니다.');
      }

      if (!enrollmentData.class_id && !enrollmentData.course_id) {
        throw new Error('클래스 ID 또는 코스 ID 중 하나는 필수입니다.');
      }

      // 중복 수강신청 확인
      const existingEnrollment = await Enrollment.findOne({
        where: {
          user_id: enrollmentData.user_id,
          [Op.or]: [
            { class_id: enrollmentData.class_id },
            { course_id: enrollmentData.course_id }
          ],
          status: 'active'
        }
      });

      if (existingEnrollment) {
        throw new Error('이미 수강신청한 클래스/코스입니다.');
      }

      // 클래스/코스 존재 여부 확인
      if (enrollmentData.class_id) {
        const classData = await Class.findByPk(enrollmentData.class_id);
        if (!classData) {
          throw new Error('존재하지 않는 클래스입니다.');
        }
        if (!classData.is_active) {
          throw new Error('현재 신청할 수 없는 클래스입니다.');
        }
      }

      if (enrollmentData.course_id) {
        const courseData = await OnlineCourse.findByPk(enrollmentData.course_id);
        if (!courseData) {
          throw new Error('존재하지 않는 코스입니다.');
        }
        if (courseData.status !== 'published') {
          throw new Error('현재 신청할 수 없는 코스입니다.');
        }
      }

      const newEnrollment = await Enrollment.create(enrollmentData);
      logger.info(`새로운 수강신청이 생성되었습니다: ${newEnrollment.id}`);
      
      return newEnrollment.toJSON();
    } catch (error) {
      logger.error('수강신청 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 수강신청 ID로 조회
   */
  async getEnrollmentById(enrollmentId) {
    try {
      const enrollment = await Enrollment.findByPk(enrollmentId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'username', 'email']
          },
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'title', 'category'],
            required: false
          },
          {
            model: OnlineCourse,
            as: 'course',
            attributes: ['id', 'title', 'subject'],
            required: false
          }
        ]
      });
      
      if (!enrollment) {
        throw new Error('수강신청을 찾을 수 없습니다.');
      }
      
      return enrollment.toJSON();
    } catch (error) {
      logger.error('수강신청 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 수강신청 상태 변경
   */
  async updateEnrollmentStatus(enrollmentId, status) {
    try {
      const validStatuses = ['active', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 상태입니다.');
      }

      const [updatedRows] = await Enrollment.update(
        { status },
        { where: { id: enrollmentId } }
      );
      
      if (updatedRows === 0) {
        throw new Error('수강신청을 찾을 수 없습니다.');
      }

      const updatedEnrollment = await this.getEnrollmentById(enrollmentId);
      logger.info(`수강신청 상태가 변경되었습니다: ${enrollmentId} -> ${status}`);
      return updatedEnrollment;
    } catch (error) {
      logger.error('수강신청 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 수강 진행률 업데이트
   */
  async updateProgress(enrollmentId, progress) {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error('진행률은 0-100 사이의 값이어야 합니다.');
      }

      const [updatedRows] = await Enrollment.update(
        { 
          progress,
          status: progress === 100 ? 'completed' : 'active'
        },
        { where: { id: enrollmentId } }
      );
      
      if (updatedRows === 0) {
        throw new Error('수강신청을 찾을 수 없습니다.');
      }

      const updatedEnrollment = await this.getEnrollmentById(enrollmentId);
      logger.info(`수강 진행률이 업데이트되었습니다: ${enrollmentId} -> ${progress}%`);
      return updatedEnrollment;
    } catch (error) {
      logger.error('수강 진행률 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 사용자별 수강신청 목록 조회
   */
  async getEnrollmentsByUser(userId) {
    try {
      const enrollments = await Enrollment.findAll({
        where: { user_id: userId },
        include: [
          {
            model: Class,
            as: 'class',
            attributes: ['id', 'title', 'category'],
            required: false
          },
          {
            model: OnlineCourse,
            as: 'course',
            attributes: ['id', 'title', 'subject'],
            required: false
          }
        ],
        order: [['enrolled_at', 'DESC']]
      });
      
      return enrollments;
    } catch (error) {
      logger.error('사용자별 수강신청 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 수강신청 통계 조회
   */
  async getEnrollmentStats() {
    try {
      const totalEnrollments = await Enrollment.count();
      const activeEnrollments = await Enrollment.count({ where: { status: 'active' } });
      const completedEnrollments = await Enrollment.count({ where: { status: 'completed' } });
      const cancelledEnrollments = await Enrollment.count({ where: { status: 'cancelled' } });
      
      const avgProgressResult = await Enrollment.findOne({
        attributes: [[Enrollment.sequelize.fn('AVG', Enrollment.sequelize.col('progress')), 'avgProgress']],
        where: { status: 'active' }
      });
      
      return {
        total_enrollments: totalEnrollments,
        active_enrollments: activeEnrollments,
        completed_enrollments: completedEnrollments,
        cancelled_enrollments: cancelledEnrollments,
        avg_progress: avgProgressResult?.dataValues?.avgProgress || 0
      };
    } catch (error) {
      logger.error('수강신청 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 수강신청 취소
   */
  async cancelEnrollment(enrollmentId, userId) {
    try {
      const enrollment = await Enrollment.findOne({
        where: { 
          id: enrollmentId,
          user_id: userId 
        }
      });
      
      if (!enrollment) {
        throw new Error('수강신청을 찾을 수 없거나 권한이 없습니다.');
      }

      if (enrollment.status === 'cancelled') {
        throw new Error('이미 취소된 수강신청입니다.');
      }

      if (enrollment.status === 'completed') {
        throw new Error('완료된 수강신청은 취소할 수 없습니다.');
      }

      await enrollment.update({ status: 'cancelled' });
      
      logger.info(`수강신청이 취소되었습니다: ${enrollmentId}`);
      return enrollment.toJSON();
    } catch (error) {
      logger.error('수강신청 취소 실패:', error);
      throw error;
    }
  }
}

module.exports = new EnrollmentService(); 
module.exports = EnrollmentService; 