const jwt = require('jsonwebtoken');
const config = require('../config/env');
const constants = require('../config/constants');
const logger = require('../utils/logger');

// JWT 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: '액세스 토큰이 필요합니다'
    });
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('JWT 토큰 검증 실패:', err.message);
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '유효하지 않은 토큰입니다'
      });
    }
    req.user = user;
    next();
  });
};

// 역할 기반 권한 확인 미들웨어
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(constants.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: '인증이 필요합니다'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`권한 부족: 사용자 ${req.user.userId}가 ${roles} 역할이 필요한 작업을 시도`);
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: '이 작업을 수행할 권한이 없습니다'
      });
    }

    next();
  };
};

// 소켓 인증 미들웨어
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

  if (!token) {
    return next(new Error('인증 토큰이 필요합니다'));
  }

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('소켓 JWT 토큰 검증 실패:', err.message);
      return next(new Error('유효하지 않은 토큰입니다'));
    }
    
    socket.user = user;
    next();
  });
};

// 선택적 인증 (토큰이 있으면 검증, 없어도 통과)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, config.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authenticateSocket,
  optionalAuth
}; 