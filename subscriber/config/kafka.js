const { Kafka } = require('kafkajs');

let producer;
let consumer;

async function setupKafka() {
  try {
    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID,
      brokers: [process.env.KAFKA_BROKER]
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ 
      groupId: process.env.KAFKA_GROUP_ID
    });

    await producer.connect();
    await consumer.connect();
    
    console.log('Kafka 연결이 설정되었습니다');
    
    return { producer, consumer };
  } catch (error) {
    console.error('Kafka 연결 실패:', error);
    throw error;
  }
}

module.exports = {
  setupKafka,
  getProducer: () => producer,
  getConsumer: () => consumer
}; 