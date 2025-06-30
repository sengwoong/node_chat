const UserModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const constants = require('../config/constants');


class UserService {
  constructor() {
    this.userModel = new UserModel();
  }

  // 사용자 회원가입
  async registerUser(userData) {
    try {
      // 이메일 중복 확인
      const existingEmail = await this.userModel.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error('이미 사용 중인 이메일입니다');
      }

      // 사용자명 중복 확인
      const existingUsername = await this.userModel.getUserByUsername(userData.username);
      if (existingUsername) {
        throw new Error('이미 사용 중인 사용자명입니다');
      }

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // 사용자 생성
      const userId = await this.userModel.createUser({
        ...userData,
        password: hashedPassword
      });

      const user = await this.userModel.getUserById(userId);
      
      logger.info(`사용자 회원가입 완료: ${user.username} (ID: ${userId})`);
      return user;
    } catch (error) {
      logger.error('사용자 회원가입 서비스 오류:', error);
      throw error;
    }
  }

  // 사용자 로그인
  async loginUser(credentials) {
    try {
      const { username, password } = credentials;

      // 사용자 조회
      const user = await this.userModel.getUserByUsername(username);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 비밀번호 확인
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('비밀번호가 일치하지 않습니다');
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // 비밀번호 제외하고 사용자 정보 반환
      const { password: _, ...userWithoutPassword } = user;
      
      logger.info(`사용자 로그인 완료: ${user.username} (ID: ${user.id})`);
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('사용자 로그인 서비스 오류:', error);
      throw error;
    }
  }

  // 사용자 목록 조회
  async getUsers(filters = {}) {
    try {
      const result = await this.userModel.getUsers(filters);
      logger.info(`사용자 목록 조회 완료: ${result.users.length}명`);
      return result;
    } catch (error) {
      logger.error('사용자 목록 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 사용자 상세 정보 조회
  async getUserById(userId) {
    try {
      const user = await this.userModel.getUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }
      
      logger.info(`사용자 상세 조회 완료: ${user.username} (ID: ${userId})`);
      return user;
    } catch (error) {
      logger.error('사용자 상세 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 사용자 정보 업데이트
  async updateUser(userId, updateData) {
    try {
      const result = await this.userModel.updateUser(userId, updateData);
      
      if (result) {
        const updatedUser = await this.userModel.getUserById(userId);
        logger.info(`사용자 정보 업데이트 완료: ${updatedUser.username} (ID: ${userId})`);
        return updatedUser;
      } else {
        throw new Error('사용자 정보 업데이트에 실패했습니다');
      }
    } catch (error) {
      logger.error('사용자 정보 업데이트 서비스 오류:', error);
      throw error;
    }
  }

  // 비밀번호 변경
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // 현재 사용자 정보 조회
      const user = await this.userModel.getUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 기존 비밀번호 확인
      const isValidPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidPassword) {
        throw new Error('현재 비밀번호가 일치하지 않습니다');
      }

      // 새 비밀번호 해시화
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 비밀번호 업데이트
      const result = await this.userModel.updatePassword(userId, hashedNewPassword);
      
      if (result) {
        logger.info(`비밀번호 변경 완료: 사용자 ID ${userId}`);
        return true;
      } else {
        throw new Error('비밀번호 변경에 실패했습니다');
      }
    } catch (error) {
      logger.error('비밀번호 변경 서비스 오류:', error);
      throw error;
    }
  }

  // 사용자 삭제
  async deleteUser(userId) {
    try {
      const result = await this.userModel.deleteUser(userId);
      
      if (result) {
        logger.info(`사용자 삭제 완료: 사용자 ID ${userId}`);
        return true;
      } else {
        throw new Error('사용자 삭제에 실패했습니다');
      }
    } catch (error) {
      logger.error('사용자 삭제 서비스 오류:', error);
      throw error;
    }
  }

  // 강사 목록 조회
  async getTeachers() {
    try {
      const teachers = await this.userModel.getTeachers();
      logger.info(`강사 목록 조회 완료: ${teachers.length}명`);
      return teachers;
    } catch (error) {
      logger.error('강사 목록 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 사용자 통계 조회
  async getUserStats() {
    try {
      const stats = await this.userModel.getUserStats();
      logger.info('사용자 통계 조회 완료');
      return stats;
    } catch (error) {
      logger.error('사용자 통계 조회 서비스 오류:', error);
      throw error;
    }
  }

  // JWT 토큰 검증
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await this.userModel.getUserById(decoded.id);
      
      if (!user) {
        throw new Error('유효하지 않은 토큰입니다');
      }
      
      return user;
    } catch (error) {
      logger.error('토큰 검증 실패:', error);
      throw new Error('유효하지 않은 토큰입니다');
    }
  }

  // 사용자 프로필 조회
  async getUserProfile(userId) {
    try {
      const user = await this.userModel.getUserById(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }
      
      // 비밀번호 제외하고 반환
      const { password, ...userProfile } = user;
      
      logger.info(`사용자 프로필 조회 완료: ${user.username} (ID: ${userId})`);
      return userProfile;
    } catch (error) {
      logger.error('사용자 프로필 조회 서비스 오류:', error);
      throw error;
    }
  }
}

module.exports = UserService; 