const videoService = require('./videoService');
const { asyncHandler } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const constants = require('../config/constants');

class VideoController {
  // 비디오 업로드
  uploadVideo = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '비디오 파일이 필요합니다'
      });
    }

    const { title, description, category } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    const videoData = await videoService.processUploadedVideo(
      req.file,
      {
        title,
        description,
        category,
        userId
      }
    );

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: videoData
    });
  });

  // 비디오 스트리밍 시작
  startStreaming = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const userId = req.user?.id || 'anonymous';

    const streamData = await videoService.startStreaming({
      title,
      description,
      userId
    });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: streamData
    });
  });

  // 비디오 스트리밍 중지
  stopStreaming = asyncHandler(async (req, res) => {
    const { streamId } = req.params;
    const userId = req.user?.id || 'anonymous';

    const result = await videoService.stopStreaming(streamId, userId);

    if (!result) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '스트림을 찾을 수 없거나 중지할 권한이 없습니다'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: '스트리밍이 중지되었습니다',
      data: result
    });
  });

  // 비디오 목록 조회
  getVideoList = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const videos = await videoService.getVideoList({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search
    });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: videos
    });
  });

  // 비디오 상세 정보 조회
  getVideoInfo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await videoService.getVideoInfo(videoId);

    if (!video) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '비디오를 찾을 수 없습니다'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: video
    });
  });

  // 비디오 스트리밍 URL 조회
  getStreamingUrl = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const streamingUrl = await videoService.getStreamingUrl(videoId);

    if (!streamingUrl) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '스트리밍 URL을 찾을 수 없습니다'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: { streamingUrl }
    });
  });

  // 비디오 다운로드
  downloadVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { quality = 'original' } = req.query;

    const downloadInfo = await videoService.getDownloadInfo(videoId, quality);

    if (!downloadInfo) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: '다운로드 파일을 찾을 수 없습니다'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: downloadInfo
    });
  });

  // 비디오 삭제
  deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?.id || 'anonymous';

    const result = await videoService.deleteVideo(videoId, userId);

    if (!result) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '비디오를 삭제할 권한이 없습니다'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: '비디오가 삭제되었습니다'
    });
  });

  // 비디오 메타데이터 업데이트
  updateVideoMetadata = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, category, tags } = req.body;
    const userId = req.user?.id || 'anonymous';

    const result = await videoService.updateVideoMetadata(
      videoId,
      { title, description, category, tags },
      userId
    );

    if (!result) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '비디오를 수정할 권한이 없습니다'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: result
    });
  });

  // 라이브 스트림 상태 조회
  getLiveStreamStatus = asyncHandler(async (req, res) => {
    const { streamId } = req.params;

    const status = await videoService.getLiveStreamStatus(streamId);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: status
    });
  });

  // 비디오 처리 상태 조회
  getProcessingStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const status = await videoService.getProcessingStatus(videoId);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: status
    });
  });
}

module.exports = new VideoController(); 