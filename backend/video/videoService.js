const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const config = require('../config/env');
const constants = require('../config/constants');

class VideoService {
  constructor() {
    this.streams = new Map(); // streamId -> stream info
    this.processingVideos = new Map(); // videoId -> processing info
  }

  // 업로드된 비디오 처리
  async processUploadedVideo(file, metadata) {
    try {
      const videoId = Date.now().toString();
      const { title, description, category, userId } = metadata;
      
      // 비디오 정보 저장
      const videoInfo = {
        id: videoId,
        title,
        description,
        category,
        userId,
        originalPath: file.path,
        status: 'processing',
        createdAt: new Date()
      };

      // 비디오 변환 및 처리
      await this.convertVideo(file.path, videoId);
      
      // 처리 완료 후 상태 업데이트
      videoInfo.status = 'completed';
      videoInfo.processedPath = path.join(config.VIDEO_RECORDED_PATH, `${videoId}.mp4`);
      
      logger.info(`비디오 처리 완료: ${videoId}`);
      
      return videoInfo;
    } catch (error) {
      logger.error('비디오 처리 실패:', error);
      throw error;
    }
  }

  // 비디오 변환
  async convertVideo(inputPath, videoId) {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(config.VIDEO_RECORDED_PATH, `${videoId}.mp4`);
      
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-preset fast',
          '-crf 23'
        ])
        .output(outputPath)
        .on('end', () => {
          logger.info(`비디오 변환 완료: ${videoId}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error(`비디오 변환 실패: ${videoId}`, err);
          reject(err);
        })
        .run();
    });
  }

  // 스트리밍 시작
  async startStreaming(streamData) {
    try {
      const streamId = Date.now().toString();
      const { title, description, userId } = streamData;
      
      const stream = {
        id: streamId,
        title,
        description,
        userId,
        status: 'active',
        startedAt: new Date(),
        viewers: 0,
        streamKey: this.generateStreamKey(streamId)
      };

      this.streams.set(streamId, stream);
      
      logger.info(`스트리밍 시작: ${streamId} by ${userId}`);
      
      return stream;
    } catch (error) {
      logger.error('스트리밍 시작 실패:', error);
      throw error;
    }
  }

  // 스트리밍 중지
  async stopStreaming(streamId, userId) {
    try {
      const stream = this.streams.get(streamId);
      if (!stream) {
        return false;
      }

      // 스트림 소유자만 중지 가능
      if (stream.userId !== userId) {
        return false;
      }

      stream.status = 'ended';
      stream.endedAt = new Date();
      
      logger.info(`스트리밍 중지: ${streamId} by ${userId}`);
      
      return stream;
    } catch (error) {
      logger.error('스트리밍 중지 실패:', error);
      throw error;
    }
  }

  // 비디오 목록 조회
  async getVideoList(filters = {}) {
    try {
      const { page = 1, limit = 10, category, search } = filters;
      
      // 실제로는 데이터베이스에서 조회
      const videos = [
        {
          id: '1',
          title: '샘플 비디오',
          description: '샘플 비디오 설명',
          category: '교육',
          userId: 'user1',
          status: 'completed',
          createdAt: new Date()
        }
      ];

      return {
        videos,
        total: videos.length,
        page,
        limit,
        totalPages: Math.ceil(videos.length / limit)
      };
    } catch (error) {
      logger.error('비디오 목록 조회 실패:', error);
      throw error;
    }
  }

  // 비디오 정보 조회
  async getVideoInfo(videoId) {
    try {
      // 실제로는 데이터베이스에서 조회
      const video = {
        id: videoId,
        title: '샘플 비디오',
        description: '샘플 비디오 설명',
        category: '교육',
        userId: 'user1',
        status: 'completed',
        createdAt: new Date(),
        duration: 3600, // 초
        size: 1024 * 1024 * 100 // 100MB
      };

      return video;
    } catch (error) {
      logger.error('비디오 정보 조회 실패:', error);
      throw error;
    }
  }

  // 스트리밍 URL 조회
  async getStreamingUrl(videoId) {
    try {
      const video = await this.getVideoInfo(videoId);
      if (!video) {
        return null;
      }

      // HLS 스트리밍 URL 생성
      const streamingUrl = `/stream/${videoId}/playlist.m3u8`;
      
      return streamingUrl;
    } catch (error) {
      logger.error('스트리밍 URL 조회 실패:', error);
      throw error;
    }
  }

  // 다운로드 정보 조회
  async getDownloadInfo(videoId, quality = 'original') {
    try {
      const video = await this.getVideoInfo(videoId);
      if (!video) {
        return null;
      }

      const downloadInfo = {
        videoId,
        quality,
        url: `/recorded/${videoId}.mp4`,
        size: video.size,
        format: 'mp4'
      };

      return downloadInfo;
    } catch (error) {
      logger.error('다운로드 정보 조회 실패:', error);
      throw error;
    }
  }

  // 비디오 삭제
  async deleteVideo(videoId, userId) {
    try {
      const video = await this.getVideoInfo(videoId);
      if (!video) {
        return false;
      }

      // 비디오 소유자만 삭제 가능
      if (video.userId !== userId) {
        return false;
      }

      // 파일 삭제
      const videoPath = path.join(config.VIDEO_RECORDED_PATH, `${videoId}.mp4`);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }

      logger.info(`비디오 삭제: ${videoId} by ${userId}`);
      
      return true;
    } catch (error) {
      logger.error('비디오 삭제 실패:', error);
      throw error;
    }
  }

  // 비디오 메타데이터 업데이트
  async updateVideoMetadata(videoId, metadata, userId) {
    try {
      const video = await this.getVideoInfo(videoId);
      if (!video) {
        return false;
      }

      // 비디오 소유자만 수정 가능
      if (video.userId !== userId) {
        return false;
      }

      // 실제로는 데이터베이스에서 업데이트
      const updatedVideo = {
        ...video,
        ...metadata,
        updatedAt: new Date()
      };

      logger.info(`비디오 메타데이터 업데이트: ${videoId} by ${userId}`);
      
      return updatedVideo;
    } catch (error) {
      logger.error('비디오 메타데이터 업데이트 실패:', error);
      throw error;
    }
  }

  // 라이브 스트림 상태 조회
  async getLiveStreamStatus(streamId) {
    try {
      const stream = this.streams.get(streamId);
      if (!stream) {
        return null;
      }

      return {
        ...stream,
        isLive: stream.status === 'active'
      };
    } catch (error) {
      logger.error('라이브 스트림 상태 조회 실패:', error);
      throw error;
    }
  }

  // 비디오 처리 상태 조회
  async getProcessingStatus(videoId) {
    try {
      const processing = this.processingVideos.get(videoId);
      if (!processing) {
        return { status: 'not_found' };
      }

      return processing;
    } catch (error) {
      logger.error('비디오 처리 상태 조회 실패:', error);
      throw error;
    }
  }

  // 스트림 키 생성
  generateStreamKey(streamId) {
    return `stream_${streamId}_${Date.now()}`;
  }

  // 뷰어 수 업데이트
  async updateViewerCount(streamId, count) {
    try {
      const stream = this.streams.get(streamId);
      if (stream) {
        stream.viewers = count;
      }
    } catch (error) {
      logger.error('뷰어 수 업데이트 실패:', error);
    }
  }
}

module.exports = new VideoService(); 