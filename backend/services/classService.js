const ClassModel = require('../models/classModel');
const logger = require('../utils/logger');

class ClassService {
  constructor() {
    this.classModel = new ClassModel();
  }

  /**
   * 클래스 목록 조회
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @param {string} status - 상태 필터
   * @param {string} search - 검색어
   * @returns {Promise<Object>} 클래스 목록과 페이지네이션 정보
   */
  async getClasses(page = 1, limit = 10, status = null, search = null) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.classModel.getClasses(limit, offset, status, search);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        classes: result.classes,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('클래스 목록 조회 실패:', error);
      throw new Error('클래스 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 클래스 생성
   * @param {Object} classData - 클래스 데이터
   * @returns {Promise<Object>} 생성된 클래스 정보
   */
  async createClass(classData) {
    try {
      // 필수 필드 검증
      const requiredFields = ['name', 'description', 'max_students', 'start_date', 'end_date', 'schedule', 'location', 'price'];
      for (const field of requiredFields) {
        if (!classData[field]) {
          throw new Error(`${field} 필드는 필수입니다.`);
        }
      }

      // 날짜 유효성 검증
      const startDate = new Date(classData.start_date);
      const endDate = new Date(classData.end_date);
      
      if (startDate >= endDate) {
        throw new Error('종료일은 시작일보다 늦어야 합니다.');
      }

      if (startDate < new Date()) {
        throw new Error('시작일은 오늘 이후여야 합니다.');
      }

      // 가격 유효성 검증
      if (classData.price < 0) {
        throw new Error('가격은 0 이상이어야 합니다.');
      }

      // 최대 학생 수 유효성 검증
      if (classData.max_students <= 0) {
        throw new Error('최대 학생 수는 1명 이상이어야 합니다.');
      }

      const newClass = await this.classModel.createClass(classData);
      logger.info(`새로운 클래스가 생성되었습니다: ${newClass.id}`);
      
      return newClass;
    } catch (error) {
      logger.error('클래스 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 ID로 조회
   * @param {number} classId - 클래스 ID
   * @returns {Promise<Object|null>} 클래스 정보
   */
  async getClassById(classId) {
    try {
      const classData = await this.classModel.getClassById(classId);
      return classData;
    } catch (error) {
      logger.error('클래스 조회 실패:', error);
      throw new Error('클래스 정보를 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 클래스 정보 수정
   * @param {number} classId - 클래스 ID
   * @param {Object} updateData - 수정할 데이터
   * @returns {Promise<Object>} 수정된 클래스 정보
   */
  async updateClass(classId, updateData) {
    try {
      // 날짜 유효성 검증
      if (updateData.start_date && updateData.end_date) {
        const startDate = new Date(updateData.start_date);
        const endDate = new Date(updateData.end_date);
        
        if (startDate >= endDate) {
          throw new Error('종료일은 시작일보다 늦어야 합니다.');
        }
      }

      // 가격 유효성 검증
      if (updateData.price !== undefined && updateData.price < 0) {
        throw new Error('가격은 0 이상이어야 합니다.');
      }

      // 최대 학생 수 유효성 검증
      if (updateData.max_students !== undefined && updateData.max_students <= 0) {
        throw new Error('최대 학생 수는 1명 이상이어야 합니다.');
      }

      const updatedClass = await this.classModel.updateClass(classId, updateData);
      
      if (!updatedClass) {
        throw new Error('클래스를 찾을 수 없습니다.');
      }

      logger.info(`클래스가 수정되었습니다: ${classId}`);
      return updatedClass;
    } catch (error) {
      logger.error('클래스 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 삭제
   * @param {number} classId - 클래스 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  async deleteClass(classId) {
    try {
      const result = await this.classModel.deleteClass(classId);
      
      if (!result) {
        throw new Error('클래스를 찾을 수 없습니다.');
      }

      logger.info(`클래스가 삭제되었습니다: ${classId}`);
      return true;
    } catch (error) {
      logger.error('클래스 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 강사별 클래스 목록 조회
   * @param {number} teacherId - 강사 ID
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 클래스 목록과 페이지네이션 정보
   */
  async getClassesByTeacher(teacherId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.classModel.getClassesByTeacher(teacherId, limit, offset);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        classes: result.classes,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('강사별 클래스 목록 조회 실패:', error);
      throw new Error('강사별 클래스 목록을 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 클래스 상태 업데이트
   * @param {number} classId - 클래스 ID
   * @param {string} status - 새로운 상태
   * @returns {Promise<Object>} 업데이트된 클래스 정보
   */
  async updateClassStatus(classId, status) {
    try {
      const validStatuses = ['active', 'inactive', 'completed'];
      
      if (!validStatuses.includes(status)) {
        throw new Error('유효하지 않은 상태입니다.');
      }

      const updatedClass = await this.classModel.updateClass(classId, { status });
      
      if (!updatedClass) {
        throw new Error('클래스를 찾을 수 없습니다.');
      }

      logger.info(`클래스 상태가 변경되었습니다: ${classId} -> ${status}`);
      return updatedClass;
    } catch (error) {
      logger.error('클래스 상태 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 통계 조회
   * @returns {Promise<Object>} 클래스 통계 정보
   */
  async getClassStats() {
    try {
      const stats = await this.classModel.getClassStats();
      return stats;
    } catch (error) {
      logger.error('클래스 통계 조회 실패:', error);
      throw new Error('클래스 통계를 조회하는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 클래스 검색
   * @param {string} searchTerm - 검색어
   * @param {number} page - 페이지 번호
   * @param {number} limit - 페이지당 항목 수
   * @returns {Promise<Object>} 검색 결과
   */
  async searchClasses(searchTerm, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      const result = await this.classModel.searchClasses(searchTerm, limit, offset);
      
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        classes: result.classes,
        pagination: {
          total: result.total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error('클래스 검색 실패:', error);
      throw new Error('클래스 검색 중 오류가 발생했습니다.');
    }
  }
}

module.exports = ClassService; 