const express = require('express');
const dotenv = require('dotenv');
const { setupKafka } = require('./config/kafka');
const { setupConsumer } = require('./services/consumerService');
const { setupRoutes } = require('./routes');
const { setupDatabase } = require('./config/database');
const { getLocalIP } = require('./utils/network');

// 환경 변수 로드
dotenv.config();

// Express 앱 초기화
const app = express();

// 기본 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 설정
const cors = require('cors');
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['ORIGIN', 'Content-Length', 'Content-Type', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Origin', 'Authorization', 'X-Requested-With', 'expires'],
  exposedHeaders: ['ORIGIN', 'Content-Length', 'Content-Type', 'Access-Control-Allow-Headers', 'Access-Control-Allow-Origin', 'Authorization', 'X-Requested-With', 'expires'],
  credentials: true
}));

async function startServer() {
  try {
    // 데이터베이스 설정
    await setupDatabase();
    
    // Kafka 설정
    const kafka = await setupKafka();
    
    // Kafka 컨슈머 설정 및 시작
    setupConsumer(kafka);
    
    // 라우트 설정
    setupRoutes(app);
    
    const PORT = process.env.PORT || 2020;
    app.listen(PORT, async () => {
      const ip = getLocalIP();
      console.log(`Subscriber 서버가 http://${ip}:${PORT}에서 실행 중입니다`);
      
      // 서버 정보 등록 (가용 서버로 표시)
      try {
        const database = require('./config/database');
        await database.getPool().query(
          "INSERT INTO chatting.serverInfo(`ip`, `available`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `available` = VALUES(`available`)", 
          [`${ip}:${PORT}`, 1]
        );
        
        // Kafka에 서버 상태 이벤트 발행
        const { producer } = kafka;
        await producer.send({
          topic: 'chat',
          messages: [
            { 
              value: JSON.stringify({ 
                IP: `${ip}:${PORT}`, 
                Status: true,
                Type: 'subscriber'
              }) 
            },
          ],
        });
        
        console.log('서버 정보가 등록되었습니다');
      } catch (err) {
        console.error('서버 정보 등록 실패:', err);
      }
    });
    
    // 종료 시 이벤트 처리
    process.on('SIGINT', async () => {
      const ip = getLocalIP();
      const PORT = process.env.PORT || 2020;
      
      try {
        const database = require('./config/database');
        await database.getPool().execute(
          "UPDATE chatting.serverInfo SET available = ? WHERE ip = ?", 
          [0, `${ip}:${PORT}`]
        );
        
        // Kafka에 서버 상태 이벤트 발행
        const { producer } = kafka;
        await producer.send({
          topic: 'chat',
          messages: [
            { 
              value: JSON.stringify({ 
                IP: `${ip}:${PORT}`, 
                Status: false,
                Type: 'subscriber'
              }) 
            },
          ],
        });
        
        console.log('서버 종료 처리가 완료되었습니다');
        process.exit(0);
      } catch (err) {
        console.error('서버 종료 처리 실패:', err);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

startServer(); 