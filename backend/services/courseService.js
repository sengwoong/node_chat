const CourseModel = require('../models/courseModel');
const logger = require('../utils/logger');

class CourseService {
  constructor() {
    this.courseModel = new CourseModel();
  }

  /**
   * 코스 목록 조회
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @param {string} status - 상태 필터
   * @param {string} level - 난이도 필터
   * @param {string} category - 카테고리 필터
   * @param {string} search - 검색어
   * @returns {Promise<Object>} 코스 목록과 페이지네이션 정보
   */
  async getCourses(page = 1, limit = 10, status = null, level = null, category = null, search = null) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.courseModel.getCourses(limit, offset, status, level, category, search);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        courses: result.courses,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('코스 목록 조회 실패:', error);
      throw new Error('코스 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 코스 생성
   * @param {Object} courseData - 코스 데이터
   * @returns {Promise<Object>} 생성된 코스 정보
   */
  async createCourse(courseData) {
    try {
      // 필수 필드 검증
      const requiredFields = ['title', 'description', 'price', 'duration', 'level', 'category'];
      for (const field of requiredFields) {
        if (!courseData[field]) {
          throw new Error(`${field} 필드는 필수입니다.`);
        }
      }

      // 가격 유효성 검증
      if (courseData.price < 0) {
        throw new Error('가격은 0 이상이어야 합니다.');
      }

      // 강의 시간 유효성 검증
      if (courseData.duration <= 0) {
        throw new Error('강의 시간은 1분 이상이어야 합니다.');
      }

      // 난이도 유효성 검증
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      if (!validLevels.includes(courseData.level)) {
        throw new Error('유효하지 않은 난이도입니다.');
      }

      const newCourse = await this.courseModel.createCourse(courseData);
      logger.info(`새로운 코스가 생성되었습니다: ${newCourse.id}`);
      
      return newCourse;
    } catch (error) {
      logger.error('코스 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 ID로 조회
   * @param {number} courseId - 코스 ID
   * @returns {Promise<Object|null>} 코스 정보
   */
  async getCourseById(courseId) {
    try {
      const courseData = await this.courseModel.getCourseById(courseId);
      return courseData;
    } catch (error) {
      logger.error('코스 조회 실패:', error);
      throw new Error('코스 정보를 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 코스 정보 수정
   * @param {number} courseId - 코스 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Promise<Object>} 수정된 코스 정보
   */
  async updateCourse(courseId, updateData) {
    try {
      // 가격 유효성 검증
      if (updateData.price !== undefined && updateData.price < 0) {
        throw new Error('가격은 0 이상이어야 합니다.');
      }

      // 강의 시간 유효성 검증
      if (updateData.duration !== undefined && updateData.duration <= 0) {
        throw new Error('강의 시간은 1분 이상이어야 합니다.');
      }

      // 난이도 유효성 검증
      if (updateData.level) {
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(updateData.level)) {
          throw new Error('유효하지 않은 난이도입니다.');
        }
      }

      // 상태 유효성 검증
      if (updateData.status) {
        const validStatuses = ['draft', 'published', 'archived'];
        if (!validStatuses.includes(updateData.status)) {
          throw new Error('유효하지 않은 상태입니다.');
        }
      }

      const updatedCourse = await this.courseModel.updateCourse(courseId, updateData);
      
      if (!updatedCourse) {
        throw new Error('코스를 찾을 수 없습니다.');
      }

      logger.info(`코스가 수정되었습니다: ${courseId}`);
      return updatedCourse;
    } catch (error) {
      logger.error('코스 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 삭제
   * @param {number} courseId - 코스 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async deleteCourse(courseId) {
    try {
      const result = await this.courseModel.deleteCourse(courseId);
      
      if (!result) {
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
   * @param {number} teacherId - 강사 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 코스 목록과 페이지네이션 정보
   */
  async getCoursesByTeacher(teacherId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.courseModel.getCoursesByTeacher(teacherId, limit, offset);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        courses: result.courses,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('강사별 코스 목록 조회 실패:', error);
      throw new Error('강사별 코스 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 코스 섹션 목록 조회
   * @param {number} courseId - 코스 ID
   * @returns {Promise<Array>} 섹션 목록
   */
  async getCourseSections(courseId) {
    try {
      const sections = await this.courseModel.getCourseSections(courseId);
      return sections;
    } catch (error) {
      logger.error('코스 섹션 목록 조회 실패:', error);
      throw new Error('코스 섹션 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 코스 섹션 추가
   * @param {Object} sectionData - 섹션 데이터
   * @returns {Promise<Object>} 생성된 섹션 정보
   */
  async addCourseSection(sectionData) {
    try {
      // 필수 필드 검증
      const requiredFields = ['course_id', 'title', 'description', 'order_index', 'video_url', 'duration'];
      for (const field of requiredFields) {
        if (!sectionData[field]) {
          throw new Error(`${field} 필드는 필수입니다.`);
        }
      }

      // 강의 시간 유효성 검증
      if (sectionData.duration <= 0) {
        throw new Error('강의 시간은 1분 이상이어야 합니다.');
      }

      // 순서 인덱스 유효성 검증
      if (sectionData.order_index <= 0) {
        throw new Error('순서 인덱스는 1 이상이어야 합니다.');
      }

      const newSection = await this.courseModel.addCourseSection(sectionData);
      logger.info(`새로운 코스 섹션이 추가되었습니다: ${newSection.id}`);
      
      return newSection;
    } catch (error) {
      logger.error('코스 섹션 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 섹션 수정
   * @param {number} sectionId - 섹션 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Promise<Object>} 수정된 섹션 정보
   */
  async updateCourseSection(sectionId, updateData) {
    try {
      // 강의 시간 유효성 검증
      if (updateData.duration !== undefined && updateData.duration <= 0) {
        throw new Error('강의 시간은 1분 이상이어야 합니다.');
      }

      // 순서 인덱스 유효성 검증
      if (updateData.order_index !== undefined && updateData.order_index <= 0) {
        throw new Error('순서 인덱스는 1 이상이어야 합니다.');
      }

      const updatedSection = await this.courseModel.updateCourseSection(sectionId, updateData);
      
      if (!updatedSection) {
        throw new Error('섹션을 찾을 수 없습니다.');
      }

      logger.info(`코스 섹션이 수정되었습니다: ${sectionId}`);
      return updatedSection;
    } catch (error) {
      logger.error('코스 섹션 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 섹션 삭제
   * @param {number} sectionId - 섹션 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async deleteCourseSection(sectionId) {
    try {
      const result = await this.courseModel.deleteCourseSection(sectionId);
      
      if (!result) {
        throw new Error('섹션을 찾을 수 없습니다.');
      }

      logger.info(`코스 섹션이 삭제되었습니다: ${sectionId}`);
      return true;
    } catch (error) {
      logger.error('코스 섹션 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 상태 업데이트
   * @param {number} courseId - 코스 ID
   * @param {string} status - 새로운 상태
   * @returns {Promise<Object>} 업데이트된 코스 정보
   */
  async updateCourseStatus(courseId, status) {
    try {
      const validStatuses = ['draft', 'published', 'archived'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 상태입니다.');
      }

      const updatedCourse = await this.courseModel.updateCourse(courseId, { status });
      
      if (!updatedCourse) {
        throw new Error('코스를 찾을 수 없습니다.');
      }

      logger.info(`코스 상태가 변경되었습니다: ${courseId} -> ${status}`);
      return updatedCourse;
    } catch (error) {
      logger.error('코스 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 코스 통계 조회
   * @returns {Promise<Object>} 코스 통계 정보
   */
  async getCourseStats() {
    try {
      const stats = await this.courseModel.getCourseStats();
      return stats;
    } catch (error) {
      logger.error('코스 통계 조회 실패:', error);
      throw new Error('코스 통계를 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 코스 검색
   * @param {string} searchTerm - 검색어
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 검색 결과
   */
  async searchCourses(searchTerm, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.courseModel.searchCourses(searchTerm, limit, offset);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        courses: result.courses,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('코스 검색 실패:', error);
      throw new Error('코스 검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 인기 코스 조회
   * @param {number} limit - 조회할 코스 수
   * @returns {Promise<Array>} 인기 코스 목록
   */
  async getPopularCourses(limit = 10) {
    try {
      const popularCourses = await this.courseModel.getPopularCourses(limit);
      return popularCourses;
    } catch (error) {
      logger.error('인기 코스 조회 실패:', error);
      throw new Error('인기 코스를 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 카테고리별 코스 조회
   * @param {string} category - 카테고리
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 카테고리별 코스 목록
   */
  async getCoursesByCategory(category, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.courseModel.getCoursesByCategory(category, limit, offset);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        courses: result.courses,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('카테고리별 코스 조회 실패:', error);
      throw new Error('카테고리별 코스를 조회하는 중 오류가 발생했습니다.');
    }
  }
}

module.exports = CourseService; 