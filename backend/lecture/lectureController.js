const lectureService = require('./lectureService');
const { asyncHandler } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class LectureController {
  // 강의 생성
  createLecture = asyncHandler(async (req, res) => {
    const { title, description, category, thumbnail, videoUrl } = req.body;
    const instructorId = req.user?.id || 'anonymous';
    
    if (!title || !description) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '제목과 설명이 필요합니다'
      });
    }
    
    const lectureData = await lectureService.createLecture({
      title,
      description,
      instructorId,
      category,
      status: constants.LECTURE_STATUS.DRAFT,
      thumbnail,
      videoUrl
    });
    
    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: lectureData
    });
  });

  // 강의 목록 조회
  getLectureList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, status, search } = req.query;
    
    const lectures = await lectureService.getLectureList({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      status,
      search
    });
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lectures
    });
  });

  // 강의 상세 정보 조회
  getLectureDetail = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    
    const lecture = await lectureService.getLectureById(lectureId);
    
    if (!lecture) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '강의를 찾을 수 없습니다'
      });
    }
    
    // 조회수 증가
    await lectureService.incrementViewCount(lectureId);
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lecture
    });
  });

  // 강의 업데이트
  updateLecture = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const { title, description, category, status, thumbnail, videoUrl } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    const result = await lectureService.updateLecture(lectureId, {
      title,
      description,
      category,
      status,
      thumbnail,
      videoUrl
    });
    
    if (!result) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '강의를 수정할 권한이 없습니다'
      });
    }
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: '강의가 업데이트되었습니다'
    });
  });

  // 강의 삭제
  deleteLecture = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    const result = await lectureService.deleteLecture(lectureId);
    
    if (!result) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '강의를 삭제할 권한이 없습니다'
      });
    }
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: '강의가 삭제되었습니다'
    });
  });

  // 강의 상태 변경
  updateLectureStatus = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    if (!Object.values(constants.LECTURE_STATUS).includes(status)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '유효하지 않은 상태입니다'
      });
    }
    
    const result = await lectureService.updateLectureStatus(lectureId, status);
    
    if (!result) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '강의 상태를 변경할 권한이 없습니다'
      });
    }
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: '강의 상태가 변경되었습니다'
    });
  });

  // 강의 좋아요/싫어요
  toggleLike = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const { isLike } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    if (typeof isLike !== 'boolean') {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'isLike는 boolean 값이어야 합니다'
      });
    }
    
    const result = await lectureService.toggleLike(lectureId, userId, isLike);
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // 강의 댓글 추가
  addComment = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    if (!content || content.trim().length === 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '댓글 내용이 필요합니다'
      });
    }
    
    const commentId = await lectureService.addComment(lectureId, userId, content.trim());
    
    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: { commentId }
    });
  });

  // 강의 댓글 목록 조회
  getComments = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const comments = await lectureService.getComments(lectureId, parseInt(page), parseInt(limit));
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: comments
    });
  });

  // 강의 통계 조회
  getLectureStats = asyncHandler(async (req, res) => {
    const { lectureId } = req.params;
    
    const stats = await lectureService.getLectureStats(lectureId);
    
    if (!stats) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '강의를 찾을 수 없습니다'
      });
    }
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: stats
    });
  });

  // 내 강의 목록 조회
  getMyLectures = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'anonymous';
    const { page = 1, limit = 10, status } = req.query;
    
    const lectures = await lectureService.getLectureList({
      page: parseInt(page),
      limit: parseInt(limit),
      instructorId: userId,
      status
    });
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lectures
    });
  });
}

module.exports = new LectureController(); 