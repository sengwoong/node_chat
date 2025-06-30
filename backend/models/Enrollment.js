const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  class_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'classes',
      key: 'id'
    }
  },
  course_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'online_courses',
      key: 'id'
    }
  },
  enrolled_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  }
}, {
  tableName: 'enrollments',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'class_id', 'course_id']
    },
    { fields: ['user_id'] },
    { fields: ['class_id'] },
    { fields: ['course_id'] }
  ]
});

module.exports = Enrollment; 