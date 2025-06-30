const { User, ChatRoom, ChatMessage, ChatParticipant } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ChatModel {
  // 채팅방 생성
  async createRoom(roomData) {
    try {
      // 기존 스키마에 맞춰 creator_user_id 사용
      const room = await ChatRoom.create({
        name: roomData.name,
        description: roomData.description,
        creator_user_id: roomData.creatorId, // creatorId -> creator_user_id
        is_private: roomData.isPrivate,
        max_participants: roomData.maxParticipants
      });
      return room.id;
    } catch (error) {
      logger.error('채팅방 생성 실패:', error);
      throw error;
    }
  }

  // 채팅방 목록 조회
  async getRooms(filters = {}) {
    try {
      const { page = 1, limit = 20, isPrivate = false, search } = filters;
      const offset = (page - 1) * limit;
      
      const whereClause = { is_private: isPrivate };
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await ChatRoom.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'username']
          }
        ],
        attributes: {
          include: [
            [
              ChatRoom.sequelize.fn(
                'COUNT', 
                ChatRoom.sequelize.col('participants.id')
              ),
              'participant_count'
            ]
          ]
        },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'username']
          },
          {
            model: ChatParticipant,
            as: 'participants',
            attributes: [],
            required: false
          }
        ],
        group: ['ChatRoom.id', 'creator.id'],
        order: [['created_at', 'DESC']],
        limit,
        offset,
        subQuery: false
      });

      return {
        rooms: rows,
        total: Array.isArray(count) ? count.length : count,
        page,
        limit,
        totalPages: Math.ceil((Array.isArray(count) ? count.length : count) / limit)
      };
    } catch (error) {
      logger.error('채팅방 목록 조회 실패:', error);
      throw error;
    }
  }

  // 채팅방 상세 정보 조회
  async getRoomById(roomId) {
    try {
      const room = await ChatRoom.findByPk(roomId, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'username']
          }
        ],
        attributes: {
          include: [
            [
              ChatRoom.sequelize.literal(
                '(SELECT COUNT(*) FROM room_participants WHERE room_id = ChatRoom.id)'
              ),
              'participant_count'
            ]
          ]
        }
      });

      return room;
    } catch (error) {
      logger.error('채팅방 상세 조회 실패:', error);
      throw error;
    }
  }

  // 채팅방 참가자 추가
  async addParticipant(roomId, userId) {
    try {
      const [participant, created] = await ChatParticipant.findOrCreate({
        where: { room_id: roomId, user_id: userId },
        defaults: { 
          room_id: roomId, 
          user_id: userId,
          joined_at: new Date(),
          last_read_at: new Date(),
          is_active: true
        }
      });

      return participant;
    } catch (error) {
      logger.error('채팅방 참가자 추가 실패:', error);
      throw error;
    }
  }

  // 채팅방 참가자 제거
  async removeParticipant(roomId, userId) {
    try {
      const result = await ChatParticipant.destroy({
        where: { room_id: roomId, user_id: userId }
      });

      return result > 0;
    } catch (error) {
      logger.error('채팅방 참가자 제거 실패:', error);
      throw error;
    }
  }

  // 채팅방 참가자 목록 조회
  async getParticipants(roomId) {
    try {
      const participants = await ChatParticipant.findAll({
        where: { room_id: roomId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'username']
          }
        ],
        order: [['joined_at', 'ASC']]
      });

      return participants;
    } catch (error) {
      logger.error('채팅방 참가자 목록 조회 실패:', error);
      throw error;
    }
  }

  // 메시지 저장
  async saveMessage(messageData) {
    try {
      const message = await ChatMessage.create(messageData);
      return message.id;
    } catch (error) {
      logger.error('메시지 저장 실패:', error);
      throw error;
    }
  }

  // 메시지 목록 조회
  async getMessages(roomId, filters = {}) {
    try {
      const { page = 1, limit = 50, beforeId } = filters;
      const offset = (page - 1) * limit;
      
      const whereClause = { room_id: roomId };
      
      if (beforeId) {
        whereClause.id = { [Op.lt]: beforeId };
      }

      const { count, rows } = await ChatMessage.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'username']
          }
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      return {
        messages: rows.reverse(), // 최신 메시지가 아래로 오도록
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      logger.error('메시지 목록 조회 실패:', error);
      throw error;
    }
  }

  // 채팅방 삭제
  async deleteRoom(roomId, creatorId) {
    try {
      const result = await ChatRoom.destroy({
        where: { id: roomId, creator_user_id: creatorId }
      });

      return result > 0;
    } catch (error) {
      logger.error('채팅방 삭제 실패:', error);
      throw error;
    }
  }

  // 채팅 통계 조회
  async getChatStats() {
    try {
      const [totalRooms, totalMessages, totalUsers, totalParticipations] = await Promise.all([
        ChatRoom.count(),
        ChatMessage.count(),
        ChatParticipant.count({ distinct: true, col: 'user_id' }),
        ChatParticipant.count()
      ]);

      return {
        total_rooms: totalRooms,
        total_messages: totalMessages,
        total_users: totalUsers,
        total_participations: totalParticipations
      };
    } catch (error) {
      logger.error('채팅 통계 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = new ChatModel(); 