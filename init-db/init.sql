CREATE DATABASE IF NOT EXISTS chatting;
USE chatting;

-- Create users table first (no dependencies)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('teacher', 'student', 'admin') DEFAULT 'student',
  profile_image VARCHAR(255),
  bio TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- Create serverInfo table (no dependencies)
CREATE TABLE IF NOT EXISTS serverInfo (
  ip VARCHAR(255) PRIMARY KEY,
  available BOOLEAN DEFAULT TRUE
);

-- Create room table (depends on users)
CREATE TABLE IF NOT EXISTS room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_user_id BIGINT NOT NULL,
  max_participants INT DEFAULT 100,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_creator (creator_user_id),
  INDEX idx_created_at (created_at)
);

-- Create chat table (depends on room and users)
CREATE TABLE IF NOT EXISTS chat (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room (room_id),
  INDEX idx_user (user_id),
  INDEX idx_created_at (created_at)
);

-- Create room_participants table (depends on room and users)
CREATE TABLE IF NOT EXISTS room_participants (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (room_id, user_id),
  INDEX idx_room (room_id),
  INDEX idx_user (user_id)
);

-- Create classes table (depends on users)
CREATE TABLE IF NOT EXISTS classes (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id BIGINT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  max_students INT DEFAULT 30,
  current_students INT DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0.00,
  location VARCHAR(255),
  schedule VARCHAR(255),
  start_date DATE,
  end_date DATE,
  status ENUM('active', 'inactive', 'completed', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher (teacher_id),
  INDEX idx_subject (subject),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date)
);

-- Create online_courses table (depends on users)
CREATE TABLE IF NOT EXISTS online_courses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id BIGINT NOT NULL,
  subject VARCHAR(100) NOT NULL,
  level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  price DECIMAL(10,2) DEFAULT 0.00,
  duration INT,
  thumbnail VARCHAR(255),
  video_url VARCHAR(255),
  preview_url VARCHAR(255),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  view_count INT DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teacher (teacher_id),
  INDEX idx_subject (subject),
  INDEX idx_status (status),
  INDEX idx_rating (rating)
);

-- Create course_sections table (depends on online_courses)
CREATE TABLE IF NOT EXISTS course_sections (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  course_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  duration INT,
  video_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES online_courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_order (order_index)
);

-- Create enrollments table (depends on users, classes, online_courses)
CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  class_id BIGINT NULL,
  course_id BIGINT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
  progress DECIMAL(5,2) DEFAULT 0.00,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES online_courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (user_id, class_id, course_id),
  INDEX idx_user (user_id),
  INDEX idx_class (class_id),
  INDEX idx_course (course_id)
);

-- Create reviews table (depends on users, classes, online_courses)
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  class_id BIGINT NULL,
  course_id BIGINT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES online_courses(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_class (class_id),
  INDEX idx_course (course_id),
  INDEX idx_rating (rating)
);

-- Insert sample data
INSERT INTO users (username, email, password, name, role, bio) VALUES
('teacher1', 'teacher1@example.com', '$2b$10$hashedpassword', '김강사', 'teacher', '수학 전문 강사입니다.'),
('teacher2', 'teacher2@example.com', '$2b$10$hashedpassword', '이영어', 'teacher', '영어 전문 강사입니다.'),
('student1', 'student1@example.com', '$2b$10$hashedpassword', '박학생', 'student', '열심히 공부하는 학생입니다.'),
('student2', 'student2@example.com', '$2b$10$hashedpassword', '최학생', 'student', '수학을 좋아하는 학생입니다.'),
('admin', 'admin@example.com', '$2b$10$hashedpassword', '관리자', 'admin', '시스템 관리자입니다.');

INSERT INTO classes (title, description, teacher_id, subject, level, max_students, price, location, schedule) VALUES
('고등 수학 기초반', '고등학교 수학의 기초를 다지는 강의입니다.', 1, '수학', 'beginner', 20, 150000.00, '서울 강남구', '월,수,금 18:00-20:00'),
('중급 수학 심화반', '수학 실력을 한 단계 끌어올리는 강의입니다.', 1, '수학', 'intermediate', 15, 200000.00, '서울 강남구', '화,목 19:00-21:00'),
('영어 회화 기초', '일상 영어 회화를 배우는 강의입니다.', 2, '영어', 'beginner', 25, 120000.00, '서울 서초구', '토,일 10:00-12:00');

INSERT INTO online_courses (title, description, teacher_id, subject, level, price, duration, status) VALUES
('수학의 정석 - 기초편', '수학 기초를 체계적으로 배우는 온라인 강의입니다.', 1, '수학', 'beginner', 80000.00, 1200, 'published'),
('고급 수학 문제 풀이', '고급 수학 문제를 단계별로 풀이하는 강의입니다.', 1, '수학', 'advanced', 120000.00, 1800, 'published'),
('영어 문법 마스터', '영어 문법을 체계적으로 정리하는 강의입니다.', 2, '영어', 'intermediate', 90000.00, 1500, 'published');

INSERT INTO course_sections (course_id, title, description, order_index, duration) VALUES
(1, '1강: 수와 연산', '자연수, 정수, 유리수의 개념과 연산', 1, 60),
(1, '2강: 방정식과 부등식', '일차방정식과 일차부등식 풀이', 2, 60),
(1, '3강: 함수의 기초', '함수의 개념과 그래프', 3, 60),
(2, '1강: 미분법', '미분의 개념과 기본 공식', 1, 90),
(2, '2강: 적분법', '적분의 개념과 기본 공식', 2, 90),
(3, '1강: 문장의 구조', '영어 문장의 기본 구조', 1, 75),
(3, '2강: 시제', '영어의 다양한 시제', 2, 75);

INSERT INTO enrollments (user_id, class_id, course_id, status, progress) VALUES
(3, 1, NULL, 'active', 75.50),
(4, 1, NULL, 'active', 60.00),
(3, NULL, 1, 'active', 45.25),
(4, NULL, 2, 'active', 30.00);

INSERT INTO reviews (user_id, class_id, course_id, rating, comment) VALUES
(3, 1, NULL, 5, '정말 좋은 강의입니다! 이해하기 쉽게 설명해주세요.'),
(4, 1, NULL, 4, '체계적으로 잘 가르쳐주시는 것 같습니다.'),
(3, NULL, 1, 5, '온라인 강의지만 질문에 답변도 빨리 해주셔서 좋습니다.'),
(4, NULL, 2, 4, '고급 내용이라 어렵지만 도움이 많이 됩니다.');

INSERT INTO room (name, description, creator_user_id) VALUES
('일반 채팅방', '자유롭게 대화할 수 있는 공간입니다.', 1),
('개발 토론방', '프로그래밍과 개발에 대해 이야기하는 방입니다.', 2),
('질문과 답변', '궁금한 것을 물어보고 답변하는 공간입니다.', 3);

INSERT INTO room_participants (room_id, user_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),  -- 일반 채팅방
(2, 2), (2, 3), (2, 5),          -- 개발 토론방
(3, 1), (3, 3), (3, 4), (3, 5);  -- 질문과 답변

INSERT INTO chat (room_id, user_id, message) VALUES
(1, 2, '안녕하세요! 처음 들어왔습니다.'),
(1, 3, '환영합니다! 즐거운 대화 나눠요.'),
(2, 2, 'Node.js 프로젝트 진행 중인데 질문 있어요.'),
(3, 4, '프로그래밍 관련 질문 받습니다!');