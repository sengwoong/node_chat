const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// 환경 변수에서 데이터베이스 설정 가져오기
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3307,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'chatting',
  dialect: 'mysql',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+09:00'
};

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logging: config.logging,
  pool: config.pool,
  timezone: config.timezone
});

// 데이터베이스 연결 테스트
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('데이터베이스 연결이 성공적으로 설정되었습니다.');
    return true;
  } catch (error) {
    logger.error('데이터베이스 연결에 실패했습니다:', error);
    return false;
  }
}

// 데이터베이스 설정 (함수명 변경)
async function setupDatabase() {
  try {
    // 연결 테스트
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('데이터베이스 연결 실패');
    }

    // 모델 동기화 (기존 테이블 구조 유지)
    await sequelize.sync({ alter: false, force: false });
    logger.info('데이터베이스 모델 동기화 완료');
    
    return true;
  } catch (error) {
    logger.error('데이터베이스 초기화 실패:', error);
    throw error;
  }
}

// 데이터베이스 연결 종료
async function closeDatabase() {
  try {
    await sequelize.close();
    logger.info('데이터베이스 연결이 종료되었습니다.');
  } catch (error) {
    logger.error('데이터베이스 연결 종료 중 오류:', error);
  }
}

module.exports = {
  sequelize,
  setupDatabase, // 함수명 변경
  closeDatabase,
  testConnection
}; 