const lectureModel = require('./lectureModel');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class LectureService {
  // 강의 생성
  async createLecture(lectureData) {
    try {
      const lectureId = await lectureModel.createLecture(lectureData);
      
      // 생성된 강의 정보 조회
      const lecture = await lectureModel.getLectureById(lectureId);
      
      logger.info(`강의 생성 완료: ${lectureId}`);
      
      return lecture;
    } catch (error) {
      logger.error('강의 생성 실패:', error);
      throw error;
    }
  }

  // 강의 목록 조회
  async getLectureList(filters = {}) {
    try {
      const result = await lectureModel.getLectureList(filters);
      
      return result;
    } catch (error) {
      logger.error('강의 목록 조회 실패:', error);
      throw error;
    }
  }

  // 강의 상세 정보 조회
  async getLectureById(lectureId) {
    try {
      const lecture = await lectureModel.getLectureById(lectureId);
      
      return lecture;
    } catch (error) {
      logger.error('강의 상세 조회 실패:', error);
      throw error;
    }
  }

  // 강의 업데이트
  async updateLecture(lectureId, updateData) {
    try {
      const result = await lectureModel.updateLecture(lectureId, updateData);
      
      if (result) {
        logger.info(`강의 업데이트 완료: ${lectureId}`);
      }
      
      return result;
    } catch (error) {
      logger.error('강의 업데이트 실패:', error);
      throw error;
    }
  }

  // 강의 삭제
  async deleteLecture(lectureId) {
    try {
      const result = await lectureModel.deleteLecture(lectureId);
      
      if (result) {
        logger.info(`강의 삭제 완료: ${lectureId}`);
      }
      
      return result;
    } catch (error) {
      logger.error('강의 삭제 실패:', error);
      throw error;
    }
  }

  // 강의 상태 변경
  async updateLectureStatus(lectureId, status) {
    try {
      const result = await lectureModel.updateLectureStatus(lectureId, status);
      
      if (result) {
        logger.info(`강의 상태 변경 완료: ${lectureId} -> ${status}`);
      }
      
      return result;
    } catch (error) {
      logger.error('강의 상태 변경 실패:', error);
      throw error;
    }
  }

  // 강의 조회수 증가
  async incrementViewCount(lectureId) {
    try {
      await lectureModel.incrementViewCount(lectureId);
    } catch (error) {
      logger.error('강의 조회수 증가 실패:', error);
      throw error;
    }
  }

  // 강의 좋아요/싫어요
  async toggleLike(lectureId, userId, isLike) {
    try {
      const result = await lectureModel.toggleLike(lectureId, userId, isLike);
      
      logger.info(`강의 좋아요/싫어요 처리: ${lectureId} by ${userId} (${isLike ? 'like' : 'dislike'})`);
      
      return result;
    } catch (error) {
      logger.error('강의 좋아요/싫어요 처리 실패:', error);
      throw error;
    }
  }

  // 강의 댓글 추가
  async addComment(lectureId, userId, content) {
    try {
      const commentId = await lectureModel.addComment(lectureId, userId, content);
      
      logger.info(`강의 댓글 추가: ${lectureId} by ${userId}`);
      
      return commentId;
    } catch (error) {
      logger.error('강의 댓글 추가 실패:', error);
      throw error;
    }
  }

  // 강의 댓글 목록 조회
  async getComments(lectureId, page = 1, limit = 20) {
    try {
      const comments = await lectureModel.getComments(lectureId, page, limit);
      
      return comments;
    } catch (error) {
      logger.error('강의 댓글 목록 조회 실패:', error);
      throw error;
    }
  }

  // 강의 통계 조회
  async getLectureStats(lectureId) {
    try {
      const stats = await lectureModel.getLectureStats(lectureId);
      
      return stats;
    } catch (error) {
      logger.error('강의 통계 조회 실패:', error);
      throw error;
    }
  }

  // 강의 검색
  async searchLectures(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: query
      };
      
      const result = await lectureModel.getLectureList(searchFilters);
      
      return result;
    } catch (error) {
      logger.error('강의 검색 실패:', error);
      throw error;
    }
  }

  // 인기 강의 조회
  async getPopularLectures(limit = 10) {
    try {
      // 실제로는 조회수, 좋아요 수 등을 기준으로 정렬
      const filters = {
        limit,
        orderBy: 'view_count',
        orderDirection: 'DESC'
      };
      
      const result = await lectureModel.getLectureList(filters);
      
      return result;
    } catch (error) {
      logger.error('인기 강의 조회 실패:', error);
      throw error;
    }
  }

  // 최신 강의 조회
  async getRecentLectures(limit = 10) {
    try {
      const filters = {
        limit,
        orderBy: 'created_at',
        orderDirection: 'DESC'
      };
      
      const result = await lectureModel.getLectureList(filters);
      
      return result;
    } catch (error) {
      logger.error('최신 강의 조회 실패:', error);
      throw error;
    }
  }

  // 강의 카테고리별 통계
  async getCategoryStats() {
    try {
      // 실제로는 데이터베이스에서 카테고리별 통계 조회
      const stats = {
        '프로그래밍': { count: 50, totalViews: 10000 },
        '디자인': { count: 30, totalViews: 5000 },
        '마케팅': { count: 20, totalViews: 3000 }
      };
      
      return stats;
    } catch (error) {
      logger.error('강의 카테고리 통계 조회 실패:', error);
      throw error;
    }
  }

  // 강의 추천
  async getRecommendedLectures(userId, limit = 10) {
    try {
      // 실제로는 사용자의 관심사, 시청 기록 등을 기반으로 추천
      const filters = {
        limit,
        excludeUserId: userId // 자신의 강의 제외
      };
      
      const result = await lectureModel.getLectureList(filters);
      
      return result;
    } catch (error) {
      logger.error('강의 추천 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = new LectureService(); 