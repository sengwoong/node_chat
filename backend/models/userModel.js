const { User } = require('./index');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

class UserModel {
  // 사용자 생성
  async createUser(userData) {
    try {
      const user = await User.create(userData);
      return user.toJSON();
    } catch (error) {
      logger.error('사용자 생성 실패:', error);
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

      const users = await User.findAll({
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
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });
      
      return user ? user.toJSON() : null;
    } catch (error) {
      logger.error('사용자 상세 조회 실패:', error);
      throw error;
    }
  }

  // 사용자명으로 조회
  async getUserByUsername(username) {
    try {
      const user = await User.findOne({
        where: { username }
      });
      
      return user ? user.toJSON() : null;
    } catch (error) {
      logger.error('사용자명으로 조회 실패:', error);
      throw error;
    }
  }

  // 이메일로 조회
  async getUserByEmail(email) {
    try {
      const user = await User.findOne({
        where: { email }
      });
      
      return user ? user.toJSON() : null;
    } catch (error) {
      logger.error('이메일로 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 정보 업데이트
  async updateUser(userId, updateData) {
    try {
      const [affectedRows] = await User.update(updateData, {
        where: { id: userId }
      });
      
      return affectedRows > 0;
    } catch (error) {
      logger.error('사용자 정보 업데이트 실패:', error);
      throw error;
    }
  }

  // 비밀번호 변경
  async updatePassword(userId, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [affectedRows] = await User.update(
        { password: hashedPassword },
        { where: { id: userId } }
      );
      
      return affectedRows > 0;
    } catch (error) {
      logger.error('비밀번호 변경 실패:', error);
      throw error;
    }
  }

  // 사용자 삭제
  async deleteUser(userId) {
    try {
      const affectedRows = await User.destroy({
        where: { id: userId }
      });
      
      return affectedRows > 0;
    } catch (error) {
      logger.error('사용자 삭제 실패:', error);
      throw error;
    }
  }

  // 강사 목록 조회
  async getTeachers() {
    try {
      const teachers = await User.findAll({
        where: { role: 'teacher' },
        attributes: ['id', 'username', 'name', 'bio', 'created_at'],
        order: [['name', 'ASC']]
      });
      
      return teachers.map(teacher => teacher.toJSON());
    } catch (error) {
      logger.error('강사 목록 조회 실패:', error);
      throw error;
    }
  }

  // 사용자 통계 조회
  async getUserStats() {
    try {
      const stats = await User.findAll({
        attributes: [
          'role',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['role'],
        raw: true
      });

      const result = {
        total_teachers: 0,
        total_students: 0,
        total_admins: 0,
        total_users: 0
      };

      stats.forEach(stat => {
        result.total_users += parseInt(stat.count);
        switch (stat.role) {
          case 'teacher':
            result.total_teachers = parseInt(stat.count);
            break;
          case 'student':
            result.total_students = parseInt(stat.count);
            break;
          case 'admin':
            result.total_admins = parseInt(stat.count);
            break;
        }
      });

      return result;
    } catch (error) {
      logger.error('사용자 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = UserModel; 