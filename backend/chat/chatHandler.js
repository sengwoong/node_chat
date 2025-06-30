const constants = require('../config/constants');
const logger = require('../utils/logger');
const chatUtils = require('./chatUtils');

// 현재 연결된 클라이언트 관리를 위한 맵
const rooms = {};

function setupChatHandlers(socket, io, kafkaProducer) {
  // 방 입장
  socket.on('join_room', (roomName) => {
    handleJoinRoom(socket, io, roomName, kafkaProducer);
  });

  // 메시지 수신 및 브로드캐스트
  socket.on('message', async (msg) => {
    handleMessage(socket, io, msg, kafkaProducer);
  });

  // 방 나가기
  socket.on('leave_room', (roomName) => {
    handleLeaveRoom(socket, io, roomName, kafkaProducer);
  });
}

function handleJoinRoom(socket, io, roomName, kafkaProducer) {
  logger.info(`사용자 ${socket.username}이(가) ${roomName} 방에 입장했습니다`);
  
  // 기존 방에서 나가기
  if (socket.currentRoom) {
    socket.leave(socket.currentRoom);
    socket.rooms.delete(socket.currentRoom);
    
    // 현재 방 목록에서 사용자 제거
    if (rooms[socket.currentRoom]) {
      rooms[socket.currentRoom] = rooms[socket.currentRoom].filter(client => client.id !== socket.id);
    }
  }
  
  // 새 방에 입장
  socket.join(roomName);
  socket.currentRoom = roomName;
  socket.rooms.add(roomName);
  
  // 방 목록 초기화
  if (!rooms[roomName]) {
    rooms[roomName] = [];
  }
  
  // 방 목록에 사용자 추가
  rooms[roomName].push({
    id: socket.id,
    username: socket.username
  });
  
  // 방 입장 알림 - Kafka로 메시지 발행
  const joinMessage = {
    type: constants.MESSAGE_TYPES.USER_JOINED,
    name: socket.username,
    message: `${socket.username}님이 입장했습니다.`,
    room: roomName,
    when: new Date()
  };
  
  // Kafka에 발행하고 소켓으로도 전송
  if (kafkaProducer) {
    kafkaProducer.send({
      topic: 'chat',
      messages: [{ value: JSON.stringify(joinMessage) }]
    }).catch(err => logger.error('Kafka 메시지 발행 실패:', err));
  }
  
  // 같은 방 사용자들에게 입장 알림
  io.to(roomName).emit(constants.SOCKET_EVENTS.USER_JOINED, joinMessage);
}

function handleMessage(socket, io, msg, kafkaProducer) {
  if (!socket.currentRoom) {
    socket.emit('error', { message: '방에 입장하지 않았습니다' });
    return;
  }
  
  // 메시지 유효성 검사
  if (!msg.message || msg.message.trim().length === 0) {
    socket.emit('error', { message: '메시지를 입력해주세요' });
    return;
  }
  
  const messageData = {
    type: 'message', // subscriber에서 인식할 수 있도록 타입 명시
    name: socket.username,
    message: msg.message.trim(),
    room: socket.currentRoom,
    when: new Date(),
    userId: socket.userId || null // 사용자 ID 추가
  };
  
  logger.info('메시지 수신 및 Kafka로 발행:', messageData);
  
  // Kafka에만 메시지 발행 (DB 저장은 subscriber에서 처리)
  if (kafkaProducer) {
    kafkaProducer.send({
      topic: 'chat',
      messages: [{ value: JSON.stringify(messageData) }]
    }).catch(err => logger.error('Kafka 메시지 발행 실패:', err));
  }
  
  // 같은 방의 모든 클라이언트에게 즉시 메시지 전송 (실시간성 유지)
  io.to(socket.currentRoom).emit('message', messageData);
}

function handleLeaveRoom(socket, io, roomName, kafkaProducer) {
  logger.info(`사용자 ${socket.username}이(가) ${roomName} 방에서 나갔습니다`);
  
  socket.leave(roomName);
  socket.rooms.delete(roomName);
  
  // 방 목록에서 사용자 제거
  if (rooms[roomName]) {
    rooms[roomName] = rooms[roomName].filter(client => client.id !== socket.id);
    
    // 방에 사용자가 없으면 방 목록에서 제거
    if (rooms[roomName].length === 0) {
      delete rooms[roomName];
    } else {
      // 퇴장 메시지를 Kafka로 발행
      const leaveMessage = {
        type: constants.MESSAGE_TYPES.USER_LEFT,
        name: socket.username,
        message: `${socket.username}님이 퇴장했습니다.`,
        room: roomName,
        when: new Date()
      };
      
      if (kafkaProducer) {
        kafkaProducer.send({
          topic: 'chat',
          messages: [{ value: JSON.stringify(leaveMessage) }]
        }).catch(err => logger.error('Kafka 메시지 발행 실패:', err));
      }
      
      // 남은 사용자들에게 퇴장 알림
      io.to(roomName).emit(constants.SOCKET_EVENTS.USER_LEFT, leaveMessage);
    }
  }
  
  // 현재 방 정보 초기화
  if (socket.currentRoom === roomName) {
    socket.currentRoom = null;
  }
}

// 방 정보 조회
function getRoomInfo(roomName) {
  return rooms[roomName] || [];
}

// 모든 방 목록 조회
function getAllRooms() {
  return Object.keys(rooms);
}

// 사용자가 속한 방 목록 조회
function getUserRooms(socketId) {
  const userRooms = [];
  Object.keys(rooms).forEach(roomName => {
    if (rooms[roomName].some(client => client.id === socketId)) {
      userRooms.push(roomName);
    }
  });
  return userRooms;
}

module.exports = {
  setupChatHandlers,
  getRoomInfo,
  getAllRooms,
  getUserRooms
}; 