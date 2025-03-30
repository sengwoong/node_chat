const roomService = require('./roomService');

async function setupConsumer(kafka) {
  const { consumer } = kafka;
  
  try {
    // 'chat' 토픽 구독
    await consumer.subscribe({ topic: 'chat', fromBeginning: false });
    
    // 메시지 처리
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = message.value.toString();
          const data = JSON.parse(messageValue);
          
          console.log('Kafka에서 메시지 수신:', data);
          
          // 메시지 타입에 따른 처리
          if (data.type === 'message') {
            // 채팅 메시지 처리
            await roomService.insertChat(data.name, data.message, data.room);
            console.log('채팅 메시지 저장 완료:', data.name, data.message, data.room);
          } 
          else if (data.type === 'user_joined' || data.type === 'user_left') {
            // 사용자 입장/퇴장 이벤트 처리 - 필요시 로깅
            console.log(`${data.type} 이벤트:`, data.name, data.room);
          }
          else if (data.Status !== undefined) {
            // 서버 상태 메시지 처리
            console.log('서버 상태 변경:', data.IP, data.Status ? '활성화' : '비활성화');
          }
          
        } catch (error) {
          console.error('메시지 처리 실패:', error);
        }
      },
    });
    
    console.log('Kafka consumer가 성공적으로 설정되었습니다');
    
  } catch (error) {
    console.error('Kafka consumer 설정 실패:', error);
    throw error;
  }
}

module.exports = { setupConsumer }; 