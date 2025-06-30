const { Kafka } = require('kafkajs');
const config = require('./env');
const logger = require('../utils/logger');

let producer;
let consumer;

async function setupKafka() {
  try {
    const kafka = new Kafka({
      clientId: config.KAFKA_CLIENT_ID,
      brokers: [config.KAFKA_BROKER]
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ 
      groupId: config.KAFKA_GROUP_ID
    });

    await producer.connect();
    await consumer.connect();
    
    logger.info('Kafka 연결이 설정되었습니다');
    
    return { producer, consumer };
  } catch (error) {
    logger.error('Kafka 연결 실패:', error);
    throw error;
  }
}

async function setupConsumer(topics, messageHandler) {
  if (!consumer) {
    throw new Error('Kafka consumer가 초기화되지 않았습니다');
  }

  try {
    // 토픽 구독
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }
    
    // 메시지 처리
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = message.value.toString();
          const data = JSON.parse(messageValue);
          
          logger.info(`Kafka 메시지 수신 [${topic}]:`, data);
          
          await messageHandler(topic, data);
        } catch (error) {
          logger.error('Kafka 메시지 처리 실패:', error);
        }
      },
    });
    
    logger.info('Kafka consumer가 성공적으로 설정되었습니다');
  } catch (error) {
    logger.error('Kafka consumer 설정 실패:', error);
    throw error;
  }
}

async function sendMessage(topic, message) {
  if (!producer) {
    throw new Error('Kafka producer가 초기화되지 않았습니다');
  }

  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    
    logger.info(`Kafka 메시지 발행 [${topic}]:`, message);
  } catch (error) {
    logger.error('Kafka 메시지 발행 실패:', error);
    throw error;
  }
}

async function disconnect() {
  try {
    if (producer) {
      await producer.disconnect();
    }
    if (consumer) {
      await consumer.disconnect();
    }
    logger.info('Kafka 연결이 종료되었습니다');
  } catch (error) {
    logger.error('Kafka 연결 종료 실패:', error);
  }
}

function getProducer() {
  if (!producer) {
    throw new Error('Kafka producer가 초기화되지 않았습니다');
  }
  return producer;
}

function getConsumer() {
  if (!consumer) {
    throw new Error('Kafka consumer가 초기화되지 않았습니다');
  }
  return consumer;
}

module.exports = {
  setupKafka,
  setupConsumer,
  sendMessage,
  disconnect,
  getProducer,
  getConsumer
}; 