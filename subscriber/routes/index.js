const roomController = require('./roomController');

function setupRoutes(app) {
  // 서버 모니터링 API
  app.get('/server-list', roomController.getServerList);
  
  // 기본 경로
  app.get('/', (req, res) => {
    res.json({ message: 'Node.js 채팅 Subscriber 서버 API가 실행 중입니다.' });
  });
  
  return app;
}

module.exports = { setupRoutes }; 