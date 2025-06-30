const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ChatParticipant = sequelize.define('ChatParticipant', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  room_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'room',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'room_participants',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['room_id', 'user_id']
    }
  ]
});

module.exports = ChatParticipant; 