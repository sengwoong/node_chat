const mysql = require('mysql2/promise');

let pool;

async function setupDatabase() {
  try {
    pool = mysql.createPool({
      host: 'localhost', // Docker 컨테이너 이름 대신 localhost 사용
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3307, // Docker에서 매핑된 외부 포트 사용
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true
    });
    
    console.log(`데이터베이스 연결 시도 (포트: 3307)`);
    
    // 연결 테스트
    const connection = await pool.getConnection();
    console.log('데이터베이스 연결이 설정되었습니다');
    connection.release();
    
    return { pool };
  } catch (error) {
    console.error('데이터베이스 연결 실패:', error);
    throw error;
  }
}

// pool이 없을 때 null 반환하지 않도록 수정
module.exports = {
  setupDatabase,
  pool: () => pool || null,
  getPool: () => pool || null
}; 