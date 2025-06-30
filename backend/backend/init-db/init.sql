-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS chatting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chatting;

-- 기존 테이블 삭제 (완전 재설정)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS room_participants;
DROP TABLE IF EXISTS room_messages;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS serverInfo;
SET FOREIGN_KEY_CHECKS = 1;

-- 사용자 테이블
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
  profile_image VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 채팅방 테이블 (JSON 제거, 개별 컬럼 사용)
CREATE TABLE room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  creator_user_id BIGINT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  max_participants INT DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
ㅣㄴ  rtc_enabled BOOLEAN DEFAULT FALSE COMMENT 'WebRTC 화상통화 기능 활성화 여부',
  rtc_video_enabled BOOLEAN DEFAULT TRUE COMMENT '비디오 기능 활성화',
  rtc_audio_enabled BOOLEAN DEFAULT TRUE COMMENT '오디오 기능 활성화',
  rtc_screen_sharing_enabled BOOLEAN DEFAULT TRUE COMMENT '화면 공유 기능 활성화',
  rtc_max_participants INT DEFAULT 10 COMMENT '최대 RTC 참여자 수',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room_creator (creator_user_id),
  INDEX idx_room_active (is_active)
);

-- 채팅 메시지 테이블
CREATE TABLE room_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT,
  username VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_messages_room (room_id, created_at),
  INDEX idx_messages_user (user_id)
);

-- 채팅방 참가자 테이블
CREATE TABLE room_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_room_user (room_id, user_id),
  INDEX idx_participants_room (room_id),
  INDEX idx_participants_user (user_id)
);

-- 서버 정보 테이블
CREATE TABLE serverInfo (
  ip VARCHAR(50) PRIMARY KEY,
  available BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 기본 데이터 삽입
INSERT INTO users (name, email, username, password, role) VALUES
('관리자', 'admin@example.com', 'admin', '$2b$10$example_hash', 'admin'),
('테스트 사용자', 'test@example.com', 'testuser', '$2b$10$example_hash', 'student');

-- 채팅방 생성
INSERT INTO room (name, description, creator_user_id, is_private, rtc_enabled) VALUES
('일반 채팅방', '누구나 참여할 수 있는 일반 채팅방입니다.', 1, FALSE, FALSE),
('화상통화방', 'WebRTC 화상통화가 가능한 방입니다.', 1, FALSE, TRUE);
