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
    socket.on('join', async (data) => {
      const { room, name } = data;
      console.log(`${name}님이 ${room} 방에 입장했습니다.`);
      
      // 방에 입장
      socket.join(room);
      
      // 현재 방 목록 확인 (디버깅용)
      console.log('현재 방 목록:', socket.rooms);
      console.log(`${room} 방의 참가자 수:`, io.sockets.adapter.rooms.get(room)?.size || 0);
      
      // 입장 이벤트를 Kafka에 발행
      try {
        const { producer } = kafka;
        await producer.send({
          topic: 'chat',
          messages: [
            { 
              value: JSON.stringify({ 
                type: 'user_joined',
                room,
                name,
                message: `${name}님이 입장했습니다.`,
                timestamp: new Date().toISOString()
              }) 
            },
          ],
        });
        console.log('입장 이벤트 Kafka 발행 완료:', name, room);
      } catch (error) {
        console.error('입장 이벤트 발행 중 오류:', error);
      }
    });

    // 메시지 처리
    socket.on('message', async (data) => {
      try {
        console.log('메시지 수신:', data); // 서버 측 로그 추가
        
        const { room, name, message } = data;
        
        // 같은 방에 있는 모든 클라이언트에 메시지 브로드캐스트
        io.to(room).emit('message', { name, message });
        
        // Kafka producer에 메시지 전송 (DB 저장은 subscriber에서 처리)
        const { producer } = kafka;
        await producer.send({
          topic: 'chat',
          messages: [
            { 
              value: JSON.stringify({ 
                type: 'message',
                room, 
                name, 
                message,
                timestamp: new Date().toISOString()
              }) 
            },
          ],
        });
        console.log('메시지 Kafka 발행 완료:', name, message, room);
      } catch (error) {
        console.error('메시지 처리 중 오류:', error);
      }
    });

    // 방 퇴장 처리
    socket.on('leave', async (data) => {
      const { room, name } = data;
      console.log(`${name}님이 ${room} 방에서 퇴장했습니다.`);
      socket.leave(room);
      
      // 퇴장 이벤트를 Kafka에 발행
      try {
        const { producer } = kafka;
        await producer.send({
          topic: 'chat',
          messages: [
            { 
              value: JSON.stringify({ 
                type: 'user_left',
                room,
                name,
                message: `${name}님이 퇴장했습니다.`,
                timestamp: new Date().toISOString()
              }) 
            },
          ],
        });
        console.log('퇴장 이벤트 Kafka 발행 완료:', name, room);
      } catch (error) {
        console.error('퇴장 이벤트 발행 중 오류:', error);
      }
    });

    // 연결 해제 처리
    socket.on('disconnect', () => {
      console.log('클라이언트 연결 해제:', socket.id);
    });
  });

  return io;
}

module.exports = { setupSocketIO }; 