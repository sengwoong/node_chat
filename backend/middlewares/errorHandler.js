const constants = require('../config/constants');
const logger = require('../utils/logger');

// 404 에러 처리
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(constants.HTTP_STATUS.NOT_FOUND);
  next(error);
};

// 전역 에러 핸들러
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // MySQL 에러 처리
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = constants.HTTP_STATUS.BAD_REQUEST;
    message = '중복된 데이터입니다';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = constants.HTTP_STATUS.BAD_REQUEST;
    message = '참조된 데이터가 존재하지 않습니다';
  }

  // JWT 에러 처리
  if (err.name === 'JsonWebTokenError') {
    statusCode = constants.HTTP_STATUS.UNAUTHORIZED;
    message = '유효하지 않은 토큰입니다';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = constants.HTTP_STATUS.UNAUTHORIZED;
    message = '토큰이 만료되었습니다';
  }

  // Validation 에러 처리
  if (err.name === 'ValidationError') {
    statusCode = constants.HTTP_STATUS.BAD_REQUEST;
    message = '입력 데이터가 유효하지 않습니다';
  }

  // 파일 업로드 에러 처리
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = constants.HTTP_STATUS.BAD_REQUEST;
    message = '파일 크기가 너무 큽니다';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = constants.HTTP_STATUS.BAD_REQUEST;
    message = '예상치 못한 파일 필드입니다';
  }

  // 에러 로깅
  logger.error('에러 발생:', {
    statusCode,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 응답 전송
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 비동기 에러 래퍼
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 소켓 에러 핸들러
const socketErrorHandler = (socket, error) => {
  logger.error('소켓 에러:', {
    socketId: socket.id,
    error: error.message,
    stack: error.stack
  });

  socket.emit('error', {
    message: '서버 에러가 발생했습니다',
    code: 'INTERNAL_ERROR'
  });
};

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  socketErrorHandler
}; 