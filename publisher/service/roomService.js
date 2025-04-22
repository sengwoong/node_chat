const roomRepository = require('../repository/roomRepository');
const { getPool } = require('../config/database');

// Kafka 발행 함수를 위해 추가 (임시로 전역 변수 사용, 실제로는 의존성 주입 방식으로 개선 필요)
let kafkaProducer = null;

// Kafka Producer 설정
function setKafkaProducer(producer) {
  kafkaProducer = producer;
}

class RoomService {
  async getRoomList() {
    try {
      return await roomRepository.getRoomList();
    } catch (error) {
      throw error;
    }
  }

  // 채팅방 생성 - Kafka로 이벤트 발행
  async createRoom(name, userId) {
    try {
      // Subscriber가 DB에 저장할 수 있도록 Kafka에 메시지 발행
      if (kafkaProducer) {
        // Prepare the message payload
        const messagePayload = {
          type: 'room_create',
          name,
          userId,
          timestamp: new Date().toISOString()
        };

        // Log the payload right before sending to Kafka
        console.log('[Publisher Service] Preparing to send Kafka message:', JSON.stringify(messagePayload));

        await kafkaProducer.send({
          topic: 'chat',
          messages: [
            { 
              value: JSON.stringify(messagePayload) 
            },
          ],
        });
        console.log('채팅방 생성 요청을 Kafka로 발행:', name, 'UserId:', userId);
        return true;
      } else {
        console.error('Kafka producer가 설정되지 않았습니다');
        throw new Error('Kafka producer 미설정');
      }
    } catch (error) {
      console.error('채팅방 생성 요청 발행 실패:', error);
      throw error;
    }
  }

  async getRoom(name) {
    try {
      return await roomRepository.getRoom(name);
    } catch (error) {
      throw error;
    }
  }

  async getAvailableServers() {
    try {
      return await roomRepository.getAvailableServers();
    } catch (error) {
      throw error;
    }
  }

  async getChatList(roomName) {
    try {
      return await roomRepository.getChatList(roomName);
    } catch (error) {
      throw error;
    }
  }

  // Publisher는 채팅 메시지 저장을 직접 수행하지 않음
  // 저장은 Subscriber에서 담당
  // 만약 API를 통한 메시지 전송이 필요하면 이 메서드를 사용하는 대신
  // Kafka에 메시지를 발행하도록 수정 필요
  async insertChat(name, message, roomName) {
    console.log('메시지 저장은 Subscriber가 담당합니다. Kafka로 메시지 발행이 필요합니다.');
    
    // Kafka 발행 예시
    if (kafkaProducer) {
      await kafkaProducer.send({
        topic: 'chat',
        messages: [
          { 
            value: JSON.stringify({ 
              type: 'message',
              room: roomName, 
              name, 
              message,
              timestamp: new Date().toISOString()
            }) 
          },
        ],
      });
      return true;
    } else {
      console.error('Kafka producer가 설정되지 않았습니다');
      return false;
    }
  }

  // 채팅방 삭제 - Kafka로 이벤트 발행
  async deleteRoom(name, userId) {
    try {
      // Subscriber가 DB에서 삭제할 수 있도록 Kafka에 메시지 발행
      if (kafkaProducer) {
        // Prepare the message payload including userId
        const messagePayload = {
          type: 'room_delete',
          name,
          userId,
          timestamp: new Date().toISOString()
        };
        
        // Log the payload being sent
        console.log('[Publisher Service] Preparing to send Kafka delete message:', JSON.stringify(messagePayload));

        await kafkaProducer.send({
          topic: 'chat',
          messages: [
            { 
              // Send the full payload
              value: JSON.stringify(messagePayload) 
            },
          ],
        });
        // Update log message
        console.log('채팅방 삭제 요청을 Kafka로 발행:', name, 'Requested by userId:', userId);
        return true;
      } else {
        console.error('Kafka producer가 설정되지 않았습니다');
        throw new Error('Kafka producer 미설정');
      }
    } catch (error) {
      console.error('채팅방 삭제 요청 발행 실패:', error);
      throw error;
    }
  }
}

module.exports = {
  roomService: new RoomService(),
  setKafkaProducer
}; 