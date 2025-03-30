const mysql = require('mysql2/promise');

let pool;

async function setupDatabase() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3307, // Docker MySQL 포트
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });
    
    console.log('데이터베이스 연결이 설정되었습니다');
    
    // 연결 확인
    const connection = await pool.getConnection();
    connection.release();
    return { pool };
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
    throw error;
  }
}

module.exports = {
  setupDatabase,
  pool: () => pool,
  getPool: () => pool
}; 