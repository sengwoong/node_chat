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
            // 채팅 메시지를 데이터베이스에 저장 (Subscriber의 주요 역할)
            await roomService.insertChat(data.name, data.message, data.room);
            console.log('채팅 메시지 DB 저장 완료:', data.name, data.message, data.room);
          } 
          else if (data.type === 'room_create') {
            // 채팅방 생성 처리
            await roomService.createRoom(data.name);
            console.log('채팅방 생성 완료:', data.name);
          }
          else if (data.type === 'room_delete') {
            // 채팅방 삭제 처리
            await roomService.deleteRoom(data.name);
            console.log('채팅방 삭제 완료:', data.name);
          }
          else if (data.type === 'user_joined' || data.type === 'user_left') {
            // 사용자 입장/퇴장 이벤트 처리 - 필요시 로깅 또는 저장
            console.log(`${data.type} 이벤트:`, data.name, data.room);
            // 필요시 입장/퇴장 정보도 저장 가능
            // await roomService.logUserEvent(data.type, data.name, data.room);
          }
          else if (data.Status !== undefined) {
            // 서버 상태 메시지 처리
            console.log('서버 상태 변경:', data.IP, data.Status ? '활성화' : '비활성화');
            
            // 필요시 서버 상태 정보 저장 (이미 DB에 직접 저장되므로 주석 처리)
            // if (data.Type !== 'subscriber') {
            //   await roomService.setServerInfo(data.IP, data.Status);
            // }
          }
          
        } catch (error) {
          console.error('메시지 처리 실패:', error);
        }
      },
    });
    
    console.log('Kafka consumer가 성공적으로 설정되었습니다 - 메시지 저장 준비 완료');
    
  } catch (error) {
    console.error('Kafka consumer 설정 실패:', error);
    throw error;
  }
}

module.exports = { setupConsumer }; 