const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OnlineCourse = sequelize.define('OnlineCourse', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  teacher_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Course duration in minutes'
  },
  thumbnail_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  video_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Main course video URL'
  },
  preview_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Course preview video URL'
  },
  total_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total duration in minutes'
  },
  total_sections: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'online_courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['teacher_id'] },
    { fields: ['subject'] },
    { fields: ['status'] }
  ]
});

module.exports = OnlineCourse; 