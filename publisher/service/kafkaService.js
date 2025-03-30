const { getProducer } = require('../config/kafka');

class KafkaService {
  async publishServerStatusEvent(ip, status) {
    try {
      const producer = getProducer();
      await producer.send({
        topic: 'chat',
        messages: [
          { 
            value: JSON.stringify({ 
              IP: ip, 
              Status: status,
              Type: 'publisher'
            }) 
          },
        ],
      });
      console.log('서버 상태 이벤트 발행 성공:', ip, status);
      return true;
    } catch (error) {
      console.error('서버 상태 이벤트 발행 실패:', error);
      throw error;
    }
  }
}

module.exports = new KafkaService(); 