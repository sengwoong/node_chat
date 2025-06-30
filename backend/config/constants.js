module.exports = {
  // HTTP 상태 코드
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },
  
  // 메시지 타입
  MESSAGE_TYPES: {
    CHAT: 'message',
    ROOM_CREATE: 'room_create',
    ROOM_DELETE: 'room_delete',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    SERVER_STATUS: 'server_status'
  },
  
  // 소켓 이벤트
  SOCKET_EVENTS: {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_ROOM: 'join_room',
    LEAVE_ROOM: 'leave_room',
    MESSAGE: 'message',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left'
  },
  
  // RTC 시그널링 이벤트
  RTC_EVENTS: {
    OFFER: 'offer',
    ANSWER: 'answer',
    ICE_CANDIDATE: 'ice-candidate',
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room'
  },
  
  // 파일 타입
  FILE_TYPES: {
    VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
    DOCUMENT: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']
  },
  
  // 강의 상태
  LECTURE_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
  },
  
  // 사용자 역할
  USER_ROLES: {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin'
  },
  
  // 기본값
  DEFAULTS: {
    ROOM_LIMIT: 100,
    MESSAGE_LIMIT: 1000,
    UPLOAD_SIZE_LIMIT: 100 * 1024 * 1024, // 100MB
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24시간
  }
}; 