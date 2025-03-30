const roomController = require('./roomController');

function setupRoutes(app, kafka, io) {
  // 채팅방 관련 API
  app.get('/room-list', roomController.getRoomList);
  app.get('/room', roomController.getRoom);
  app.post('/make-room', roomController.createRoom);
  
  // 서버 목록 API
  app.get('/server-list', roomController.getServerList);
  
  // 라우트에 채팅 내역 API 추가
  app.get('/chat-list', roomController.getChatList);
  
  // 채팅방 삭제 API 추가
  app.delete('/delete-room', roomController.deleteRoom);
  
  // 기본 경로
  app.get('/', (req, res) => {
    res.json({ message: 'Node.js 채팅 Publisher 서버 API가 실행 중입니다.' });
  });
  
  return app;
}

module.exports = { setupRoutes }; 