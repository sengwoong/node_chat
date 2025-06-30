const EnrollmentModel = require('../models/enrollmentModel');
const ClassModel = require('../models/classModel');
const CourseModel = require('../models/courseModel');
const logger = require('../utils/logger');

class EnrollmentService {
  constructor() {
    this.enrollmentModel = new EnrollmentModel();
    this.classModel = new ClassModel();
    this.courseModel = new CourseModel();
  }

  /**
   * 수강신청 목록 조회
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @param {string} status - 상태 필터
   * @param {string} enrollment_type - 수강신청 타입 필터
   * @param {number} studentId - 학생 ID (null이면 모든 학생)
   * @returns {Promise<Object>} 수강신청 목록과 페이지네이션 정보
   */
  async getEnrollments(page = 1, limit = 10, status = null, enrollment_type = null, studentId = null) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.enrollmentModel.getEnrollments(limit, offset, status, enrollment_type, studentId);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        enrollments: result.enrollments,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('수강신청 목록 조회 실패:', error);
      throw new Error('수강신청 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 수강신청 생성
   * @param {Object} enrollmentData - 수강신청 데이터
   * @returns {Promise<Object>} 생성된 수강신청 정보
   */
  async createEnrollment(enrollmentData) {
    try {
      // 필수 필드 검증
      const requiredFields = ['student_id', 'enrollment_type'];
      for (const field of requiredFields) {
        if (!enrollmentData[field]) {
          throw new Error(`${field} 필드는 필수입니다.`);
        }
      }

      // 수강신청 타입 유효성 검증
      const validTypes = ['class', 'course'];
      if (!validTypes.includes(enrollmentData.enrollment_type)) {
        throw new Error('유효하지 않은 수강신청 타입입니다.');
      }

      // 중복 수강신청 확인
      const existingEnrollment = await this.enrollmentModel.checkExistingEnrollment(
        enrollmentData.student_id,
        enrollmentData.enrollment_type,
        enrollmentData.class_id || enrollmentData.course_id
      );

      if (existingEnrollment) {
        throw new Error('이미 수강신청한 클래스/코스입니다.');
      }

      // 클래스/코스 존재 여부 및 수용 가능 여부 확인
      if (enrollmentData.enrollment_type === 'class') {
        if (!enrollmentData.class_id) {
          throw new Error('클래스 ID가 필요합니다.');
        }

        const classData = await this.classModel.getClassById(enrollmentData.class_id);
        if (!classData) {
          throw new Error('존재하지 않는 클래스입니다.');
        }

        if (classData.status !== 'active') {
          throw new Error('현재 신청할 수 없는 클래스입니다.');
        }

        if (classData.current_students >= classData.max_students) {
          throw new Error('클래스 정원이 마감되었습니다.');
        }
      } else if (enrollmentData.enrollment_type === 'course') {
        if (!enrollmentData.course_id) {
          throw new Error('코스 ID가 필요합니다.');
        }

        const courseData = await this.courseModel.getCourseById(enrollmentData.course_id);
        if (!courseData) {
          throw new Error('존재하지 않는 코스입니다.');
        }

        if (courseData.status !== 'published') {
          throw new Error('현재 신청할 수 없는 코스입니다.');
        }
      }

      const newEnrollment = await this.enrollmentModel.createEnrollment(enrollmentData);
      
      // 클래스인 경우 현재 학생 수 증가
      if (enrollmentData.enrollment_type === 'class') {
        await this.classModel.incrementCurrentStudents(enrollmentData.class_id);
      }

      logger.info(`새로운 수강신청이 생성되었습니다: ${newEnrollment.id}`);
      return newEnrollment;
    } catch (error) {
      logger.error('수강신청 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 수강신청 ID로 조회
   * @param {number} enrollmentId - 수강신청 ID
   * @returns {Promise<Object|null>} 수강신청 정보
   */
  async getEnrollmentById(enrollmentId) {
    try {
      const enrollmentData = await this.enrollmentModel.getEnrollmentById(enrollmentId);
      return enrollmentData;
    } catch (error) {
      logger.error('수강신청 조회 실패:', error);
      throw new Error('수강신청 정보를 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 수강신청 상태 변경
   * @param {number} enrollmentId - 수강신청 ID
   * @param {string} status - 새로운 상태
   * @returns {Promise<Object>} 업데이트된 수강신청 정보
   */
  async updateEnrollmentStatus(enrollmentId, status) {
    try {
      const validStatuses = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 상태입니다.');
      }

      const enrollmentData = await this.enrollmentModel.getEnrollmentById(enrollmentId);
      if (!enrollmentData) {
        throw new Error('수강신청을 찾을 수 없습니다.');
      }

      // 상태 변경 시 추가 로직
      if (status === 'rejected' && enrollmentData.enrollment_type === 'class') {
        // 거절된 경우 클래스 현재 학생 수 감소
        await this.classModel.decrementCurrentStudents(enrollmentData.class_id);
      }

      if (status === 'cancelled' && enrollmentData.enrollment_type === 'class') {
        // 취소된 경우 클래스 현재 학생 수 감소
        await this.classModel.decrementCurrentStudents(enrollmentData.class_id);
      }

      const updatedEnrollment = await this.enrollmentModel.updateEnrollmentStatus(enrollmentId, status);
      
      logger.info(`수강신청 상태가 변경되었습니다: ${enrollmentId} -> ${status}`);
      return updatedEnrollment;
    } catch (error) {
      logger.error('수강신청 상태 변경 실패:', error);
      throw error;
    }
  }

  /**
   * 수강 후기 작성
   * @param {number} enrollmentId - 수강신청 ID
   * @param {number} rating - 평점 (1-5)
   * @param {string} review - 후기 내용
   * @returns {Promise<Object>} 업데이트된 수강신청 정보
   */
  async addReview(enrollmentId, rating, review) {
    try {
      // 평점 유효성 검증
      if (rating < 1 || rating > 5) {
        throw new Error('평점은 1-5 사이의 값이어야 합니다.');
      }

      // 후기 내용 유효성 검증
      if (!review || review.trim().length === 0) {
        throw new Error('후기 내용을 입력해주세요.');
      }

      if (review.length > 1000) {
        throw new Error('후기 내용은 1000자 이하여야 합니다.');
      }

      const enrollmentData = await this.enrollmentModel.getEnrollmentById(enrollmentId);
      if (!enrollmentData) {
        throw new Error('수강신청을 찾을 수 없습니다.');
      }

      if (enrollmentData.status !== 'completed') {
        throw new Error('수강이 완료된 후에만 후기를 작성할 수 있습니다.');
      }

      const updatedEnrollment = await this.enrollmentModel.addReview(enrollmentId, rating, review);
      
      logger.info(`수강 후기가 작성되었습니다: ${enrollmentId}`);
      return updatedEnrollment;
    } catch (error) {
      logger.error('수강 후기 작성 실패:', error);
      throw error;
    }
  }

  /**
   * 학생별 수강신청 목록 조회
   * @param {number} studentId - 학생 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @param {string} status - 상태 필터
   * @returns {Promise<Object>} 수강신청 목록과 페이지네이션 정보
   */
  async getEnrollmentsByStudent(studentId, page = 1, limit = 10, status = null) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.enrollmentModel.getEnrollmentsByStudent(studentId, limit, offset, status);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        enrollments: result.enrollments,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('학생별 수강신청 목록 조회 실패:', error);
      throw new Error('학생별 수강신청 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 수강신청 통계 조회
   * @returns {Promise<Object>} 수강신청 통계 정보
   */
  async getEnrollmentStats() {
    try {
      const stats = await this.enrollmentModel.getEnrollmentStats();
      return stats;
    } catch (error) {
      logger.error('수강신청 통계 조회 실패:', error);
      throw new Error('수강신청 통계를 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 수강신청 취소
   * @param {number} enrollmentId - 수강신청 ID
   * @param {number} studentId - 학생 ID (권한 확인용)
   * @returns {Promise<Object>} 취소된 수강신청 정보
   */
  async cancelEnrollment(enrollmentId, studentId) {
    try {
      const enrollmentData = await this.enrollmentModel.getEnrollmentById(enrollmentId);
      if (!enrollmentData) {
        throw new Error('수강신청을 찾을 수 없습니다.');
      }

      if (enrollmentData.student_id !== studentId) {
        throw new Error('수강신청을 취소할 권한이 없습니다.');
      }

      if (enrollmentData.status === 'cancelled') {
        throw new Error('이미 취소된 수강신청입니다.');
      }

      if (enrollmentData.status === 'completed') {
        throw new Error('완료된 수강신청은 취소할 수 없습니다.');
      }

      const cancelledEnrollment = await this.enrollmentModel.updateEnrollmentStatus(enrollmentId, 'cancelled');
      
      // 클래스인 경우 현재 학생 수 감소
      if (enrollmentData.enrollment_type === 'class') {
        await this.classModel.decrementCurrentStudents(enrollmentData.class_id);
      }

      logger.info(`수강신청이 취소되었습니다: ${enrollmentId}`);
      return cancelledEnrollment;
    } catch (error) {
      logger.error('수강신청 취소 실패:', error);
      throw error;
    }
  }

  /**
   * 수강 진행률 업데이트
   * @param {number} enrollmentId - 수강신청 ID
   * @param {number} progress - 진행률 (0-100)
   * @returns {Promise<Object>} 업데이트된 수강신청 정보
   */
  async updateProgress(enrollmentId, progress) {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error('진행률은 0-100 사이의 값이어야 합니다.');
      }

      const enrollmentData = await this.enrollmentModel.getEnrollmentById(enrollmentId);
      if (!enrollmentData) {
        throw new Error('수강신청을 찾을 수 없습니다.');
      }

      if (enrollmentData.status !== 'approved') {
        throw new Error('승인된 수강신청만 진행률을 업데이트할 수 있습니다.');
      }

      const updatedEnrollment = await this.enrollmentModel.updateProgress(enrollmentId, progress);
      
      // 진행률이 100%인 경우 완료 상태로 변경
      if (progress === 100) {
        await this.enrollmentModel.updateEnrollmentStatus(enrollmentId, 'completed');
        logger.info(`수강이 완료되었습니다: ${enrollmentId}`);
      }

      logger.info(`수강 진행률이 업데이트되었습니다: ${enrollmentId} -> ${progress}%`);
      return updatedEnrollment;
    } catch (error) {
      logger.error('수강 진행률 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 수강신청 검색
   * @param {string} searchTerm - 검색어
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 검색 결과
   */
  async searchEnrollments(searchTerm, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.enrollmentModel.searchEnrollments(searchTerm, limit, offset);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        enrollments: result.enrollments,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('수강신청 검색 실패:', error);
      throw new Error('수강신청 검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 강사별 수강신청 목록 조회
   * @param {number} teacherId - 강사 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 수강신청 목록과 페이지네이션 정보
   */
  async getEnrollmentsByTeacher(teacherId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.enrollmentModel.getEnrollmentsByTeacher(teacherId, limit, offset);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        enrollments: result.enrollments,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('강사별 수강신청 목록 조회 실패:', error);
      throw new Error('강사별 수강신청 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }
}

module.exports = EnrollmentService; 