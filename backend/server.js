const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// 설정 및 유틸리티
const config = require('./config/env');
const logger = require('./utils/logger');
const { setupDatabase, closeDatabase } = require('./config/database');
const { setupKafka, disconnect: disconnectKafka } = require('./config/kafka');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

// 모델 초기화 (관계 설정 포함)
require('./models');

// Swagger 설정
const swagger = require('./config/swagger');

// 서비스 모듈들
const { setupChatServer } = require('./chat/chatServer');
const SignalingServer = require('./rtc/signalingServer');

// 라우트
const routes = require('./routes');

// Express 앱 초기화
const app = express();
const server = http.createServer(app);

// 보안 미들웨어
app.use(helmet());

// CORS 설정
app.use(cors({
  origin: config.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 최대 요청 수
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api/', limiter);

// 개선된 JSON 파싱 미들웨어
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // 원본 body를 저장하여 오류 시 디버깅에 사용
    req.rawBody = buf.toString();
  }
}));

// JSON 파싱 오류 처리 미들웨어 (express.json() 바로 다음에 추가)
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    const position = error.message.match(/position (\d+)/)?.[1];
    const rawBody = req.rawBody || '';
    
    console.error('🚨 JSON 파싱 오류 상세 정보:');
    console.error('URL:', req.method, req.url);
    console.error('오류 메시지:', error.message);
    console.error('오류 위치:', position);
    console.error('Content-Type:', req.headers['content-type']);
    console.error('Content-Length:', req.headers['content-length']);
    
    if (rawBody) {
      console.error('원본 Body (처음 300자):');
      console.error(rawBody.substring(0, 300));
      
      if (position) {
        const pos = parseInt(position);
        const start = Math.max(0, pos - 50);
        const end = Math.min(rawBody.length, pos + 50);
        console.error(`오류 주변 텍스트 (${start}-${end}):`);
        console.error(rawBody.substring(start, end));
        console.error(' '.repeat(Math.max(0, pos - start)) + '^--- 오류 위치');
      }
    }
    
    return res.status(400).json({
      success: false,
      message: '잘못된 JSON 형식입니다. 요청 데이터를 확인해주세요.',
      error: {
        type: 'JSON_PARSE_ERROR',
        position: position,
        details: error.message
      }
    });
  }
  next(error);
});

// 기본 미들웨어
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙
app.use('/uploads', express.static('uploads'));
app.use('/stream', express.static('stream'));
app.use('/recorded', express.static('recorded'));

// Swagger UI
app.use('/api-docs', swagger.serve, swagger.setup);

// API 라우트
app.use('/api', routes);

// 404 처리
app.use(notFound);

// 에러 핸들러
app.use(errorHandler);

// 서버 시작 함수
async function startServer() {
  try {
    logger.info('서버 시작 중...');
    
    // Sequelize 데이터베이스 연결
    await setupDatabase();
    logger.info('데이터베이스 연결 완료');
    
    // Kafka 연결 (선택적)
    try {
      await setupKafka();
      logger.info('Kafka 연결 완료');
    } catch (error) {
      logger.warn('Kafka 연결 실패 (선택적 기능):', error.message);
      logger.info('Kafka 없이 서버를 계속 실행합니다');
    }
    
    // 채팅 서버 설정
    const chatIO = setupChatServer(server);
    logger.info('채팅 서버 설정 완료');
    
    // WebRTC 시그널링 서버 설정
    const signalingServer = new SignalingServer(server);
    logger.info('WebRTC 시그널링 서버 설정 완료');
    
    // 서버 시작
    const PORT = config.PORT; // env.js에서 가져온 포트 사용
    server.listen(PORT, () => {
      logger.info(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
      logger.info(`📡 API 엔드포인트: http://localhost:${PORT}/api`);
      logger.info(`🔗 WebSocket: ws://localhost:${PORT}`);
      logger.info(`📊 헬스 체크: http://localhost:${PORT}/api/health`);
      logger.info(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
    });
    
    // Graceful Shutdown
    process.on('SIGINT', async () => {
      logger.info('서버 종료 신호를 받았습니다. 정리 작업을 시작합니다...');
      
      try {
        // Kafka 연결 종료 (있는 경우에만)
        try {
          await disconnectKafka();
          logger.info('Kafka 연결 종료 완료');
        } catch (error) {
          logger.warn('Kafka 연결 종료 실패:', error.message);
        }
        
        // 데이터베이스 연결 종료
        await closeDatabase();
        logger.info('데이터베이스 연결 종료 완료');
        
        // HTTP 서버 종료
        server.close(() => {
          logger.info('HTTP 서버 종료 완료');
          process.exit(0);
        });
        
        // 30초 후 강제 종료
        setTimeout(() => {
          logger.error('강제 종료: 정리 작업이 완료되지 않았습니다');
          process.exit(1);
        }, 30000);
        
      } catch (error) {
        logger.error('서버 종료 중 오류 발생:', error);
        process.exit(1);
      }
    });
    
    // 예상치 못한 에러 처리
    process.on('uncaughtException', (error) => {
      logger.error('예상치 못한 에러:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('처리되지 않은 Promise 거부:', reason);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

// 서버 시작
startServer();

module.exports = { app, server }; 