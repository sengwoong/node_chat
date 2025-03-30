const roomService = require('./service/roomService');

function setupSocketIO(server, kafka) {
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('클라이언트 연결됨:', socket.id);

    // 방 입장 처리
    socket.on('join', (data) => {
      const { room, name } = data;
      console.log(`${name}님이 ${room} 방에 입장했습니다.`);
      
      // 방에 입장
      socket.join(room);
      
      // 현재 방 목록 확인 (디버깅용)
      console.log('현재 방 목록:', socket.rooms);
      console.log(`${room} 방의 참가자 수:`, io.sockets.adapter.rooms.get(room)?.size || 0);
    });

    // 메시지 처리
    socket.on('message', async (data) => {
      try {
        console.log('메시지 수신:', data); // 서버 측 로그 추가
        
        const { room, name, message } = data;
        
        // 채팅 메시지 저장
        await roomService.insertChat(name, message, room);
        
        // 같은 방에 있는 모든 클라이언트에 메시지 브로드캐스트
        io.to(room).emit('message', { name, message });
        
        // Kafka producer에 메시지 전송
        const { producer } = kafka;
        await producer.send({
          topic: 'chat',
          messages: [
            { value: JSON.stringify({ room, name, message }) },
          ],
        });
      } catch (error) {
        console.error('메시지 처리 중 오류:', error);
      }
    });

    // 방 퇴장 처리
    socket.on('leave', (data) => {
      const { room, name } = data;
      console.log(`${name}님이 ${room} 방에서 퇴장했습니다.`);
      socket.leave(room);
    });

    // 연결 해제 처리
    socket.on('disconnect', () => {
      console.log('클라이언트 연결 해제:', socket.id);
    });
  });

  return io;
}

module.exports = { setupSocketIO }; 