const express = require('express');
const lectureController = require('./lectureController');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');
const constants = require('../config/constants');

const router = express.Router();

// 강의 CRUD
router.post('/', authenticateToken, lectureController.createLecture);
router.get('/', optionalAuth, lectureController.getLectureList);
router.get('/my', authenticateToken, lectureController.getMyLectures);
router.get('/:lectureId', optionalAuth, lectureController.getLectureDetail);
router.put('/:lectureId', authenticateToken, lectureController.updateLecture);
router.delete('/:lectureId', authenticateToken, lectureController.deleteLecture);

// 강의 상태 관리
router.patch('/:lectureId/status', authenticateToken, lectureController.updateLectureStatus);

// 강의 상호작용
router.post('/:lectureId/like', authenticateToken, lectureController.toggleLike);
router.post('/:lectureId/comments', authenticateToken, lectureController.addComment);
router.get('/:lectureId/comments', optionalAuth, lectureController.getComments);

// 강의 통계
router.get('/:lectureId/stats', optionalAuth, lectureController.getLectureStats);

module.exports = router; 