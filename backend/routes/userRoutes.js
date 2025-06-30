const express = require('express');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const constants = require('../config/constants');
const UserService = require('../services/userService');
const userService = new UserService();
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: "student1"
 *         email:
 *           type: string
 *           example: "student1@example.com"
 *         name:
 *           type: string
 *           example: "박학생"
 *         role:
 *           type: string
 *           enum: [teacher, student, admin]
 *           example: "student"
 *         bio:
 *           type: string
 *           example: "열심히 공부하는 학생입니다."
 *         phone:
 *           type: string
 *           example: "010-1234-5678"
 *         created_at:
 *           type: string
 *           format: date-time
 *     UserRegistration:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *         - name
 *       properties:
 *         username:
 *           type: string
 *           example: "newuser"
 *         email:
 *           type: string
 *           example: "newuser@example.com"
 *         password:
 *           type: string
 *           example: "password123"
 *         name:
 *           type: string
 *           example: "새로운 사용자"
 *         role:
 *           type: string
 *           enum: [teacher, student, admin]
 *           default: "student"
 *         bio:
 *           type: string
 *         phone:
 *           type: string
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: "student1"
 *         password:
 *           type: string
 *           example: "password123"
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: 사용자 회원가입
 *     description: 새로운 사용자를 등록합니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistration'
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post('/register', asyncHandler(async (req, res) => {
  const userData = req.body;
  
  // 필수 필드 검증
  if (!userData.username || !userData.email || !userData.password || !userData.name) {
    return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: '필수 필드가 누락되었습니다'
    });
  }
  
  const user = await userService.registerUser(userData);
  
  res.status(constants.HTTP_STATUS.CREATED).json({
    success: true,
    data: user
  });
}));

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: 사용자 로그인
 *     description: 사용자 로그인을 처리합니다.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     token:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: '사용자명과 비밀번호가 필요합니다'
    });
  }
  
  const result = await userService.loginUser({ username, password });
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
}));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: 사용자 목록 조회
 *     description: 사용자 목록을 조회합니다. (관리자만 가능)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, teacher, admin]
 *         description: 역할 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (이름, 이메일)
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const result = await userService.getUsers(parseInt(page), parseInt(limit), role, search);
    
    res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('사용자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록을 조회하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: 내 프로필 조회
 *     description: 현재 로그인한 사용자의 프로필을 조회합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 프로필
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const userProfile = await userService.getUserProfile(userId);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: userProfile
  });
}));

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: 프로필 업데이트
 *     description: 현재 로그인한 사용자의 프로필을 업데이트합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               phone:
 *                 type: string
 *               profile_image:
 *                 type: string
 *     responses:
 *       200:
 *         description: 프로필 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updateData = req.body;
  
  const updatedUser = await userService.updateUser(userId, updateData);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: updatedUser
  });
}));

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: 비밀번호 변경
 *     description: 현재 로그인한 사용자의 비밀번호를 변경합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: 비밀번호 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "비밀번호가 성공적으로 변경되었습니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: '기존 비밀번호와 새 비밀번호가 필요합니다'
    });
  }
  
  await userService.changePassword(userId, oldPassword, newPassword);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    message: '비밀번호가 성공적으로 변경되었습니다'
  });
}));

/**
 * @swagger
 * /users/teachers:
 *   get:
 *     summary: 강사 목록 조회
 *     description: 모든 강사 목록을 조회합니다.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: 강사 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/teachers', asyncHandler(async (req, res) => {
  const teachers = await userService.getTeachers();
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: teachers
  });
}));

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: 사용자 상세 정보 조회
 *     description: 특정 사용자의 상세 정보를 조회합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await userService.getUserById(parseInt(userId));
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: user
  });
}));

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: 사용자 통계 조회
 *     description: 사용자 관련 통계 정보를 조회합니다. 관리자만 접근 가능합니다.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 통계
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_teachers:
 *                       type: integer
 *                       example: 5
 *                     total_students:
 *                       type: integer
 *                       example: 100
 *                     total_admins:
 *                       type: integer
 *                       example: 2
 *                     total_users:
 *                       type: integer
 *                       example: 107
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticateToken, authorizeRole(['admin']), asyncHandler(async (req, res) => {
  const stats = await userService.getUserStats();
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: stats
  });
}));

module.exports = router; 