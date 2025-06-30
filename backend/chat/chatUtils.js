const constants = require('../config/constants');
const logger = require('../utils/logger');

// 메시지 유효성 검사
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: '메시지가 유효하지 않습니다' };
  }
  
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) {
    return { valid: false, error: '메시지를 입력해주세요' };
  }
  
  if (trimmedMessage.length > constants.DEFAULTS.MESSAGE_LIMIT) {
    return { valid: false, error: `메시지는 ${constants.DEFAULTS.MESSAGE_LIMIT}자를 초과할 수 없습니다` };
  }
  
  return { valid: true, message: trimmedMessage };
}

// 방 이름 유효성 검사
function validateRoomName(roomName) {
  if (!roomName || typeof roomName !== 'string') {
    return { valid: false, error: '방 이름이 유효하지 않습니다' };
  }
  
  const trimmedRoomName = roomName.trim();
  if (trimmedRoomName.length === 0) {
    return { valid: false, error: '방 이름을 입력해주세요' };
  }
  
  if (trimmedRoomName.length > 50) {
    return { valid: false, error: '방 이름은 50자를 초과할 수 없습니다' };
  }
  
  // 특수문자 제한
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(trimmedRoomName)) {
    return { valid: false, error: '방 이름에 사용할 수 없는 문자가 포함되어 있습니다' };
  }
  
  return { valid: true, roomName: trimmedRoomName };
}

// 사용자 이름 유효성 검사
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: '사용자 이름이 유효하지 않습니다' };
  }
  
  const trimmedUsername = username.trim();
  if (trimmedUsername.length === 0) {
    return { valid: false, error: '사용자 이름을 입력해주세요' };
  }
  
  if (trimmedUsername.length > 20) {
    return { valid: false, error: '사용자 이름은 20자를 초과할 수 없습니다' };
  }
  
  return { valid: true, username: trimmedUsername };
}

// 메시지 타입 검증
function validateMessageType(type) {
  const validTypes = Object.values(constants.MESSAGE_TYPES);
  return validTypes.includes(type);
}

// 방 참가자 수 제한 확인
function checkRoomCapacity(roomName, currentUsers) {
  if (currentUsers >= constants.DEFAULTS.ROOM_LIMIT) {
    return { allowed: false, error: '방이 가득 찼습니다' };
  }
  return { allowed: true };
}

// 메시지 필터링 (금지어, 스팸 등)
function filterMessage(message) {
  // 금지어 목록 (실제로는 DB에서 관리)
  const bannedWords = ['spam', '광고', '홍보'];
  
  let filteredMessage = message;
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
  });
  
  return filteredMessage;
}

// 메시지 통계 생성
function generateMessageStats(messages) {
  const stats = {
    totalMessages: messages.length,
    uniqueUsers: new Set(messages.map(msg => msg.name)).size,
    averageLength: 0,
    mostActiveUser: null,
    userMessageCount: {}
  };
  
  if (messages.length === 0) {
    return stats;
  }
  
  // 사용자별 메시지 수 계산
  messages.forEach(msg => {
    if (!stats.userMessageCount[msg.name]) {
      stats.userMessageCount[msg.name] = 0;
    }
    stats.userMessageCount[msg.name]++;
  });
  
  // 평균 메시지 길이 계산
  const totalLength = messages.reduce((sum, msg) => sum + msg.message.length, 0);
  stats.averageLength = Math.round(totalLength / messages.length);
  
  // 가장 활발한 사용자 찾기
  let maxCount = 0;
  Object.keys(stats.userMessageCount).forEach(username => {
    if (stats.userMessageCount[username] > maxCount) {
      maxCount = stats.userMessageCount[username];
      stats.mostActiveUser = username;
    }
  });
  
  return stats;
}

// 시간 포맷팅
function formatTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    return `${diffInMinutes}분 전`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}시간 전`;
  } else {
    return messageDate.toLocaleDateString();
  }
}

// 메시지 그룹화 (같은 사용자의 연속 메시지)
function groupMessages(messages) {
  const grouped = [];
  let currentGroup = null;
  
  messages.forEach(message => {
    if (!currentGroup || currentGroup.name !== message.name) {
      currentGroup = {
        name: message.name,
        messages: [message],
        timestamp: message.when
      };
      grouped.push(currentGroup);
    } else {
      currentGroup.messages.push(message);
    }
  });
  
  return grouped;
}

module.exports = {
  validateMessage,
  validateRoomName,
  validateUsername,
  validateMessageType,
  checkRoomCapacity,
  filterMessage,
  generateMessageStats,
  formatTime,
  groupMessages
}; 