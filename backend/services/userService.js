const { User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const constants = require('../config/constants');

class UserService {
  constructor() {
    this.userModel = User;
  }

  // 사용자 등록
  async registerUser(userData) {
    try {
      // 이메일 중복 검사
      const existingUser = await this.userModel.findOne({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        throw new Error('이미 존재하는 이메일입니다.');
      }
      
      // 사용자명 중복 검사
      const existingUsername = await this.userModel.findOne({
        where: { username: userData.username }
      });
      
      if (existingUsername) {
        throw new Error('이미 존재하는 사용자명입니다.');
      }
      
      // 사용자 생성
      const user = await this.userModel.create(userData);
      return user.toSafeJSON();
      
    } catch (error) {
      logger.error('사용자 등록 실패:', error);
      throw error;
    }
  }
  
  // 사용자 로그인
  async loginUser(username, password) {
    try {
      const user = await this.userModel.findOne({
        where: {
          [Op.or]: [
            { username: username },
            { email: username }
          ]
        }
      });
      
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('비밀번호가 올바르지 않습니다.');
      }
      
      // 마지막 로그인 시간 업데이트
      await user.update({ last_login: new Date() });
      
      return user.toSafeJSON();
      
    } catch (error) {
      logger.error('사용자 로그인 실패:', error);
      throw error;
    }
  }
  
  // 사용자 목록 조회
  async getUsers(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.role) {
        whereClause.role = filters.role;
      }
      
      if (filters.search) {
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${filters.search}%` } },
          { name: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } }
        ];
      }
      
      const users = await this.userModel.findAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']]
      });
      
      return users.map(user => user.toJSON());
      
    } catch (error) {
      logger.error('사용자 목록 조회 실패:', error);
      throw error;
    }
  }
  
  // 사용자 상세 조회
  async getUserById(userId) {
    try {
      const user = await this.userModel.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }
      
      return user.toJSON();
      
    } catch (error) {
      logger.error('사용자 상세 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 정보 업데이트
  async updateUser(userId, updateData) {
    try {
      const result = await this.userModel.update(updateData, {
        where: { id: userId }
      });
      
      if (result[0] > 0) {
        const updatedUser = await this.userModel.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });
        logger.info(`사용자 정보 업데이트 완료: ${updatedUser.username} (ID: ${userId})`);
        return updatedUser.toJSON();
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
      const user = await this.userModel.findByPk(userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 기존 비밀번호 확인
      const isValidPassword = await user.comparePassword(oldPassword);
      if (!isValidPassword) {
        throw new Error('현재 비밀번호가 일치하지 않습니다');
      }

      // 새 비밀번호 해시화
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 비밀번호 업데이트
      const result = await user.update({ password: hashedNewPassword });
      
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
      const result = await this.userModel.destroy({
        where: { id: userId }
      });
      
      if (result > 0) {
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
      const teachers = await this.userModel.findAll({
        where: { role: 'teacher' },
        attributes: { exclude: ['password'] }
      });
      logger.info(`강사 목록 조회 완료: ${teachers.length}명`);
      return teachers.map(teacher => teacher.toJSON());
    } catch (error) {
      logger.error('강사 목록 조회 서비스 오류:', error);
      throw error;
    }
  }

  // 사용자 통계 조회
  async getUserStats() {
    try {
      const stats = await this.userModel.findAll({
        attributes: [
          [this.userModel.sequelize.fn('COUNT', this.userModel.sequelize.col('id')), 'totalUsers'],
          [this.userModel.sequelize.fn('COUNT', this.userModel.sequelize.col('role')), 'totalTeachers'],
          [this.userModel.sequelize.fn('COUNT', this.userModel.sequelize.col('role')), 'totalStudents']
        ]
      });
      logger.info('사용자 통계 조회 완료');
      return stats.map(stat => stat.toJSON());
    } catch (error) {
      logger.error('사용자 통계 조회 서비스 오류:', error);
      throw error;
    }
  }

  // JWT 토큰 검증
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await this.userModel.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        throw new Error('유효하지 않은 토큰입니다');
      }
      
      return user.toJSON();
    } catch (error) {
      logger.error('토큰 검증 실패:', error);
      throw new Error('유효하지 않은 토큰입니다');
    }
  }

  // 사용자 프로필 조회
  async getUserProfile(userId) {
    try {
      const user = await this.userModel.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }
      
      return user.toJSON();
    } catch (error) {
      logger.error('사용자 프로필 조회 서비스 오류:', error);
      throw error;
    }
  }
}

// 인스턴스를 생성해서 export
module.exports = new UserService(); 