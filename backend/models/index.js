const { sequelize } = require('../config/database');

// 모델 import
const User = require('./User');
const ChatRoom = require('./ChatRoom');
const ChatMessage = require('./ChatMessage');
const ChatParticipant = require('./ChatParticipant');
const Class = require('./Class');
const OnlineCourse = require('./OnlineCourse');
const Enrollment = require('./Enrollment');

// 관계 설정
// User 관계
User.hasMany(ChatRoom, { foreignKey: 'creator_user_id', as: 'createdRooms' });
User.hasMany(Class, { foreignKey: 'teacher_id', as: 'taughtClasses' });
User.hasMany(OnlineCourse, { foreignKey: 'teacher_id', as: 'taughtCourses' });
User.hasMany(Enrollment, { foreignKey: 'user_id', as: 'enrollments' });

// ChatRoom 관계
ChatRoom.belongsTo(User, { foreignKey: 'creator_user_id', as: 'creator' });
ChatRoom.hasMany(ChatMessage, { foreignKey: 'room_id', as: 'messages' });
ChatRoom.hasMany(ChatParticipant, { foreignKey: 'room_id', as: 'participants' });

// ChatMessage 관계
ChatMessage.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'room' });
ChatMessage.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ChatParticipant 관계
ChatParticipant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ChatParticipant.belongsTo(ChatRoom, { foreignKey: 'room_id', as: 'room' });

// Class 관계
Class.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Class.hasMany(Enrollment, { foreignKey: 'class_id', as: 'enrollments' });

// OnlineCourse 관계
OnlineCourse.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
OnlineCourse.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });

// Enrollment 관계
Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Enrollment.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Enrollment.belongsTo(OnlineCourse, { foreignKey: 'course_id', as: 'course' });

// User와 ChatMessage 관계 (1:N - 사용자가 여러 메시지 작성 가능)
User.hasMany(ChatMessage, { 
  foreignKey: 'user_id', 
  as: 'messages' 
});
ChatMessage.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'sender' 
});

// User와 ChatParticipant 관계 (1:N - 사용자가 여러 채팅방 참여 가능)
User.hasMany(ChatParticipant, { 
  foreignKey: 'user_id', 
  as: 'participations' 
});

// User와 ChatRoom 다대다 관계 (참여자 관계)
User.belongsToMany(ChatRoom, { 
  through: ChatParticipant, 
  foreignKey: 'user_id', 
  otherKey: 'room_id',
  as: 'joinedRooms' 
});
ChatRoom.belongsToMany(User, { 
  through: ChatParticipant, 
  foreignKey: 'room_id', 
  otherKey: 'user_id',
  as: 'members' 
});

// 모델 내보내기
module.exports = {
  sequelize,
  User,
  ChatRoom,
  ChatMessage,
  ChatParticipant,
  Class,
  OnlineCourse,
  Enrollment
}; 