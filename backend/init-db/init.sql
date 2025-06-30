-- =====================================================
-- Unified Backend Database Initialization Script
-- 통합 백엔드 데이터베이스 초기화 스크립트
-- =====================================================

-- 데이터베이스 생성 (존재하지 않는 경우)
CREATE DATABASE IF NOT EXISTS chatting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chatting;

-- 기존 테이블 삭제 (순서 중요 - 외래키 관계 고려)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS room_participants;
DROP TABLE IF EXISTS room_messages;
DROP TABLE IF EXISTS online_courses;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. USERS 테이블 (기본 사용자 정보)
-- =====================================================
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'teacher', 'student') DEFAULT 'student',
  bio TEXT,
  phone VARCHAR(20),
  profile_image VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_users_username (username),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. ROOM 테이블 (채팅방)
-- =====================================================
CREATE TABLE room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  creator_user_id BIGINT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  max_participants INT DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room_creator (creator_user_id),
  INDEX idx_room_active (is_active),
  INDEX idx_room_private (is_private)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. ROOM_MESSAGES 테이블 (채팅 메시지)
-- =====================================================
CREATE TABLE room_messages (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT,
  username VARCHAR(50),
  message TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_messages_room (room_id),
  INDEX idx_messages_user (user_id),
  INDEX idx_messages_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ROOM_PARTICIPANTS 테이블 (채팅방 참가자)
-- =====================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. CLASSES 테이블 (오프라인 클래스)
-- =====================================================
CREATE TABLE classes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  teacher_id BIGINT NOT NULL,
  subject VARCHAR(100),
  level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  max_students INT DEFAULT 30,
  current_students INT DEFAULT 0,
  price DECIMAL(10, 2) DEFAULT 0.00,
  location VARCHAR(255),
  schedule VARCHAR(255),
  start_date DATE,
  end_date DATE,
  status ENUM('active', 'inactive', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_classes_teacher (teacher_id),
  INDEX idx_classes_status (status),
  INDEX idx_classes_subject (subject),
  INDEX idx_classes_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. ONLINE_COURSES 테이블 (온라인 코스/강의)
-- =====================================================
CREATE TABLE online_courses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  teacher_id BIGINT NOT NULL,
  subject VARCHAR(100),
  level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  price DECIMAL(10, 2) DEFAULT 0.00,
  duration INT COMMENT 'Course duration in minutes',
  thumbnail_url VARCHAR(500),
  video_url VARCHAR(500) COMMENT 'Main course video URL',
  preview_url VARCHAR(500) COMMENT 'Course preview video URL',
  total_duration INT DEFAULT 0 COMMENT 'Total duration in minutes',
  total_sections INT DEFAULT 0,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  view_count INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_courses_teacher (teacher_id),
  INDEX idx_courses_status (status),
  INDEX idx_courses_subject (subject),
  INDEX idx_courses_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. ENROLLMENTS 테이블 (수강신청)
-- =====================================================
CREATE TABLE enrollments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  class_id BIGINT NULL,
  course_id BIGINT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  progress DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Progress percentage (0-100)',
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES online_courses(id) ON DELETE CASCADE,
  
  -- 사용자는 같은 클래스/코스에 중복 수강신청 불가
  UNIQUE KEY unique_user_class (user_id, class_id),
  UNIQUE KEY unique_user_course (user_id, course_id),
  
  -- 클래스 또는 코스 중 하나는 반드시 있어야 함
  CHECK ((class_id IS NOT NULL AND course_id IS NULL) OR (class_id IS NULL AND course_id IS NOT NULL)),
  
  INDEX idx_enrollments_user (user_id),
  INDEX idx_enrollments_class (class_id),
  INDEX idx_enrollments_course (course_id),
  INDEX idx_enrollments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 초기 데이터 삽입
-- =====================================================

-- 관리자 계정 생성 (비밀번호: admin123)
INSERT INTO users (username, email, password, name, role) VALUES 
('admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', 'admin');

-- 샘플 강사 계정
INSERT INTO users (username, email, password, name, role) VALUES 
('teacher1', 'teacher1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김강사', 'teacher'),
('teacher2', 'teacher2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이선생', 'teacher');

-- 샘플 학생 계정
INSERT INTO users (username, email, password, name, role) VALUES 
('student1', 'student1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박학생', 'student'),
('student2', 'student2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '최학생', 'student');

-- 기본 채팅방 생성
INSERT INTO room (name, description, creator_user_id) VALUES 
('일반 채팅방', '자유롭게 대화를 나누는 공간입니다', 1),
('질문 & 답변', '궁금한 것들을 물어보세요', 1),
('공지사항', '중요한 공지사항을 확인하세요', 1);

-- 샘플 클래스
INSERT INTO classes (title, description, teacher_id, subject, level, max_students, price, location, schedule) VALUES 
('React 기초 클래스', 'React의 기본 개념부터 실습까지', 2, '프로그래밍', 'beginner', 20, 150000.00, '강남구 교육센터', '매주 화,목 19:00-21:00'),
('Node.js 심화 과정', 'Node.js 백엔드 개발 심화 과정', 3, '프로그래밍', 'advanced', 15, 200000.00, '서초구 교육센터', '매주 월,수,금 18:00-20:00');

-- 샘플 온라인 강의
INSERT INTO online_courses (title, description, teacher_id, subject, level, price, duration, video_url, status) VALUES 
('JavaScript 완전 정복', 'JavaScript 기초부터 고급까지 완벽 마스터', 2, '프로그래밍', 'intermediate', 99000.00, 180, 'https://example.com/js-course.mp4', 'published'),
('Python 데이터 분석', 'Python을 활용한 데이터 분석 입문', 3, '데이터사이언스', 'beginner', 120000.00, 240, 'https://example.com/python-course.mp4', 'published');

-- =====================================================
-- 인덱스 최적화
-- =====================================================

-- 복합 인덱스 추가
CREATE INDEX idx_messages_room_created ON room_messages(room_id, created_at);
CREATE INDEX idx_enrollments_user_status ON enrollments(user_id, status);
CREATE INDEX idx_classes_teacher_status ON classes(teacher_id, status);
CREATE INDEX idx_courses_teacher_status ON online_courses(teacher_id, status);

-- =====================================================
-- 완료 메시지
-- =====================================================
SELECT '✅ 데이터베이스 초기화가 완료되었습니다!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_rooms FROM room;
SELECT COUNT(*) as total_classes FROM classes;
SELECT COUNT(*) as total_courses FROM online_courses; 