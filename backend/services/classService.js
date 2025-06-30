const { Class, User, Enrollment } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ClassService {
  /**
   * 클래스 목록 조회
   */
  async getClasses(filters = {}) {
    try {
      const { page = 1, limit = 20, subject, level, teacher_id, status = 'active', search } = filters;
      const offset = (page - 1) * limit;
      
      const whereClause = {};
      if (status) whereClause.status = status;
      if (subject) whereClause.subject = subject;
      if (level) whereClause.level = level;
      if (teacher_id) whereClause.teacher_id = teacher_id;
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Class.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username', 'bio']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return {
        classes: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('오프라인 강의 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 생성
   */
  async createClass(classData) {
    try {
      const newClass = await Class.create(classData);
      return newClass.toJSON();
    } catch (error) {
      logger.error('오프라인 강의 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 ID로 조회
   */
  async getClassById(classId) {
    try {
      const classData = await Class.findByPk(classId, {
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username', 'bio']
        }]
      });
      
      if (!classData) {
        throw new Error('클래스를 찾을 수 없습니다.');
      }
      
      return classData.toJSON();
    } catch (error) {
      logger.error('클래스 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 정보 수정
   */
  async updateClass(classId, updateData) {
    try {
      const [updatedRows] = await Class.update(updateData, {
        where: { id: classId }
      });
      
      if (updatedRows === 0) {
        throw new Error('클래스를 찾을 수 없습니다.');
      }

      const updatedClass = await this.getClassById(classId);
      logger.info(`클래스가 수정되었습니다: ${classId}`);
      return updatedClass;
    } catch (error) {
      logger.error('클래스 수정 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 삭제
   */
  async deleteClass(classId) {
    try {
      const result = await Class.destroy({
        where: { id: classId }
      });
      
      if (result === 0) {
        throw new Error('클래스를 찾을 수 없습니다.');
      }

      logger.info(`클래스가 삭제되었습니다: ${classId}`);
      return true;
    } catch (error) {
      logger.error('클래스 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 강사별 클래스 목록 조회
   */
  async getClassesByTeacher(teacherId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Class.findAndCountAll({
        where: { teacher_id: teacherId },
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        classes: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('강사별 클래스 목록 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 통계 조회
   */
  async getClassStats() {
    try {
      const totalClasses = await Class.count();
      const activeClasses = await Class.count({ where: { status: 'active' } });
      const inactiveClasses = await Class.count({ where: { status: 'inactive' } });
      
      return {
        total_classes: totalClasses,
        active_classes: activeClasses,
        inactive_classes: inactiveClasses
      };
    } catch (error) {
      logger.error('클래스 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 클래스 검색
   */
  async searchClasses(searchTerm, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows } = await Class.findAndCountAll({
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${searchTerm}%` } },
            { description: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['id', 'name', 'username']
        }],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return {
        classes: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('클래스 검색 실패:', error);
      throw error;
    }
  }
}

module.exports = new ClassService(); 