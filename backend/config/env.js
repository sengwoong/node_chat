require('dotenv').config();

module.exports = {
  // 서버 설정
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // 데이터베이스 설정
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3307,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'root',
  DB_NAME: process.env.DB_NAME || 'chatting',
  
  // Kafka 설정
  KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'unified-backend',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID || 'unified-backend-group',
  
  // JWT 설정
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // 파일 업로드 설정
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 100 * 1024 * 1024, // 100MB
  
  // 비디오 설정
  VIDEO_STREAM_PATH: process.env.VIDEO_STREAM_PATH || './stream',
  VIDEO_RECORDED_PATH: process.env.VIDEO_RECORDED_PATH || './recorded',
  
  // CORS 설정
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // 로깅 설정
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
}; 