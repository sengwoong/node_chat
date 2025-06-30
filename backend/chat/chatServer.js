const socketIO = require('socket.io');
const { setupKafka } = require('../config/kafka');
const chatHandler = require('./chatHandler');
const logger = require('../utils/logger');
const constants = require('../config/constants');

let io;
let kafkaProducer;

function setupChatServer(server) {
  io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Kafka 설정
  setupKafka().then(kafka => {
    kafkaProducer = kafka.producer;
    logger.info('채팅 서버에 Kafka producer가 설정되었습니다');
  }).catch(err => {
    logger.error('Kafka 설정 실패:', err);
  });

  // 소켓 연결 처리
  io.on(constants.SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.info('새로운 소켓 연결:', socket.id);
    
    // 사용자 정보 설정
    setupUserInfo(socket);
    
    // 채팅 이벤트 핸들러 등록
    chatHandler.setupChatHandlers(socket, io, kafkaProducer);
    
    // 연결 해제 처리
    socket.on(constants.SOCKET_EVENTS.DISCONNECT, () => {
      handleDisconnect(socket);
    });
  });

  return io;
}

function setupUserInfo(socket) {
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
  socket.rooms = new Set();
  logger.info('사용자 연결:', username);
}

function handleDisconnect(socket) {
  logger.info(`사용자 ${socket.username}의 연결이 해제되었습니다`);
  
  // 모든 방에서 나가기
  socket.rooms.forEach(roomName => {
    leaveRoom(socket, roomName);
  });
}

function leaveRoom(socket, roomName) {
  socket.leave(roomName);
  socket.rooms.delete(roomName);
  
  // 퇴장 메시지를 Kafka로 발행
  if (kafkaProducer) {
    const leaveMessage = {
      type: constants.MESSAGE_TYPES.USER_LEFT,
      name: socket.username,
      message: `${socket.username}님이 퇴장했습니다.`,
      room: roomName,
      when: new Date()
    };
    
    kafkaProducer.send({
      topic: 'chat',
      messages: [{ value: JSON.stringify(leaveMessage) }]
    }).catch(err => logger.error('Kafka 메시지 발행 실패:', err));
    
    // 남은 사용자들에게 퇴장 알림
    io.to(roomName).emit(constants.SOCKET_EVENTS.USER_LEFT, leaveMessage);
  }
}

function getIO() {
  if (!io) {
    throw new Error('채팅 서버가 초기화되지 않았습니다');
  }
  return io;
}

function getKafkaProducer() {
  return kafkaProducer;
}

module.exports = {
  setupChatServer,
  getIO,
  getKafkaProducer
}; 