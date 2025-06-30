const mysql = require('mysql2/promise');
const config = require('./env');
const logger = require('../utils/logger');

let pool;

async function setupDatabase() {
  try {
    pool = mysql.createPool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      sql_mode: 'TRADITIONAL',
      timezone: 'local'
    });
    
    logger.info(`데이터베이스 연결 시도 (${config.DB_HOST}:${config.DB_PORT})`);
    
    const connection = await pool.getConnection();
    
    await connection.execute('SET NAMES utf8mb4');
    await connection.execute('SET CHARACTER SET utf8mb4');
    await connection.execute('SET character_set_connection=utf8mb4');
    
    logger.info('데이터베이스 연결이 설정되었습니다');
    connection.release();
    
    return pool;
  } catch (error) {
    logger.error('데이터베이스 연결 실패:', error);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('데이터베이스가 초기화되지 않았습니다. setupDatabase()를 먼저 호출하세요.');
  }
  return pool;
}

async function closeDatabase() {
  if (pool) {
    await pool.end();
    logger.info('데이터베이스 연결이 종료되었습니다');
  }
}

module.exports = {
  setupDatabase,
  getPool,
  closeDatabase
}; 