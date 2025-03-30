const socketIO = require('socket.io');
const { getProducer } = require('../config/kafka');

function setupSocketIO(server) {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // 현재 연결된 클라이언트 관리를 위한 맵
  const rooms = {};

  io.on('connection', (socket) => {
    console.log('새로운 소켓 연결:', socket.id);

    // 쿠키에서 사용자 이름 가져오기
    const cookies = socket.handshake.headers.cookie;
    let username = 'anonymous';
    
    if (cookies) {
      const authCookie = cookies.split(';').find(c => c.trim().startsWith('auth='));
      if (authCookie) {
        username = decodeURIComponent(authCookie.split('=')[1]);
      }
    }
    
    socket.username = username;
    console.log('사용자 연결:', username);

    // 방 입장
    socket.on('join_room', (roomName) => {
      console.log(`사용자 ${username}이(가) ${roomName} 방에 입장했습니다`);
      
      // 기존 방에서 나가기
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
        
        // 현재 방 목록에서 사용자 제거
        if (rooms[socket.currentRoom]) {
          rooms[socket.currentRoom] = rooms[socket.currentRoom].filter(client => client.id !== socket.id);
        }
      }
      
      // 새 방에 입장
      socket.join(roomName);
      socket.currentRoom = roomName;
      
      // 방 목록 초기화
      if (!rooms[roomName]) {
        rooms[roomName] = [];
      }
      
      // 방 목록에 사용자 추가
      rooms[roomName].push({
        id: socket.id,
        username: username
      });
      
      // 방 입장 알림 - Kafka로 메시지 발행
      const producer = getProducer();
      const joinMessage = {
        type: 'user_joined',
        name: username,
        message: `${username}님이 입장했습니다.`,
        room: roomName,
        when: new Date()
      };
      
      // Kafka에 발행하고 소켓으로도 전송
      producer.send({
        topic: 'chat',
        messages: [{ value: JSON.stringify(joinMessage) }]
      }).catch(err => console.error('Kafka 메시지 발행 실패:', err));
      
      // 같은 방 사용자들에게 입장 알림
      io.to(roomName).emit('user_joined', joinMessage);
    });

    // 메시지 수신 및 브로드캐스트
    socket.on('message', async (msg) => {
      if (!socket.currentRoom) return;
      
      const messageData = {
        type: 'message',
        name: username,
        message: msg.message,
        room: socket.currentRoom,
        when: new Date()
      };
      
      console.log('메시지 수신 및 Kafka로 발행:', messageData);
      
      // Kafka에 메시지 발행
      const producer = getProducer();
      producer.send({
        topic: 'chat',
        messages: [{ value: JSON.stringify(messageData) }]
      }).catch(err => console.error('Kafka 메시지 발행 실패:', err));
      
      // 같은 방의 모든 클라이언트에게 메시지 전송
      io.to(socket.currentRoom).emit('message', messageData);
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log(`사용자 ${username}의 연결이 해제되었습니다`);
      
      // 방에서 클라이언트 제거
      if (socket.currentRoom && rooms[socket.currentRoom]) {
        rooms[socket.currentRoom] = rooms[socket.currentRoom].filter(client => client.id !== socket.id);
        
        // 방에 사용자가 없으면 방 목록에서 제거
        if (rooms[socket.currentRoom].length === 0) {
          delete rooms[socket.currentRoom];
        } else {
          // 퇴장 메시지를 Kafka로 발행
          const leaveMessage = {
            type: 'user_left',
            name: username,
            message: `${username}님이 퇴장했습니다.`,
            room: socket.currentRoom,
            when: new Date()
          };
          
          const producer = getProducer();
          producer.send({
            topic: 'chat',
            messages: [{ value: JSON.stringify(leaveMessage) }]
          }).catch(err => console.error('Kafka 메시지 발행 실패:', err));
          
          // 남은 사용자들에게 퇴장 알림
          io.to(socket.currentRoom).emit('user_left', leaveMessage);
        }
      }
    });
  });

  return io;
}

module.exports = { setupSocketIO }; 