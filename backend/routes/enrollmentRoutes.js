const express = require('express');
const enrollmentService = require('../services/enrollmentService');
const { authenticateToken } = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 1
 *         class_id:
 *           type: integer
 *           example: 1
 *         course_id:
 *           type: integer
 *           example: 1
 *         enrolled_at:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           example: "active"
 *         progress:
 *           type: number
 *           example: 75.5
 *         rating:
 *           type: integer
 *           example: 5
 *         review:
 *           type: string
 *           example: "정말 좋은 강의였습니다!"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     AvailableItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "React 기초 강의"
 *         description:
 *           type: string
 *           example: "React의 기본 개념을 배웁니다"
 *         subject:
 *           type: string
 *           example: "프로그래밍"
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           example: "beginner"
 *         price:
 *           type: number
 *           example: 50000
 *         type:
 *           type: string
 *           enum: [class, course]
 *           example: "class"
 *         teacher:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             username:
 *               type: string
 */

/**
 * @swagger
 * /enrollments/available:
 *   get:
 *     summary: 수강신청 가능한 목록 조회
 *     description: 현재 수강신청 가능한 모든 클래스와 코스 목록을 조회합니다.
 *     tags: [📚 수강신청 - 공통]
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
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [class, course]
 *         description: 타입 필터 (class=오프라인 클래스, course=온라인 코스)
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: 과목 필터
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: 난이도 필터
 *     responses:
 *       200:
 *         description: 수강신청 가능 목록 조회 성공
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
 *                     $ref: '#/components/schemas/AvailableItem'
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
 */
router.get('/available', async (req, res) => {
  // ... 기존 코드 ...
});

/**
 * @swagger
 * /enrollments/my:
 *   get:
 *     summary: 내 수강신청 목록 조회
 *     description: 현재 사용자의 수강신청 목록을 조회합니다.
 *     tags: [🎓 수강신청 - 학생용]
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
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: 상태 필터
 *     responses:
 *       200:
 *         description: 내 수강신청 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Enrollment'
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
 */
router.get('/my', authenticateToken, async (req, res) => {
  // ... 기존 코드 ...
});

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: 수강신청 하기
 *     description: 새로운 수강신청을 생성합니다. (학생만 가능)
 *     tags: [🎓 수강신청 - 학생용]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enrollment_type
 *             properties:
 *               enrollment_type:
 *                 type: string
 *                 enum: [class, course]
 *                 example: "class"
 *                 description: 수강신청 타입
 *               class_id:
 *                 type: integer
 *                 example: 1
 *                 description: 오프라인 클래스 ID (enrollment_type이 class인 경우 필수)
 *               course_id:
 *                 type: integer
 *                 example: 1
 *                 description: 온라인 코스 ID (enrollment_type이 course인 경우 필수)
 *     responses:
 *       201:
 *         description: 수강신청 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: 잘못된 요청 (이미 수강신청한 경우 등)
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (학생이 아닌 경우)
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, async (req, res) => {
  // ... 기존 코드 ...
});

/**
 * @swagger
 * /enrollments/{enrollmentId}:
 *   delete:
 *     summary: 수강신청 취소
 *     description: 본인의 수강신청을 취소합니다. (학생만 가능)
 *     tags: [🎓 수강신청 - 학생용]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수강신청 ID
 *     responses:
 *       200:
 *         description: 수강신청 취소 성공
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
 *                   example: "수강신청이 취소되었습니다."
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       404:
 *         description: 수강신청을 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.delete('/:enrollmentId', authenticateToken, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const userId = req.user.userId;
    
    const result = await enrollmentService.cancelEnrollment(enrollmentId, userId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: '수강신청이 취소되었습니다.'
    });
  } catch (error) {
    logger.error('수강신청 취소 실패:', error);
    res.status(400).json({
      success: false,
      message: error.message || '수강신청 취소 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments/my-classes:
 *   get:
 *     summary: 내 클래스의 수강신청 목록
 *     description: 강사가 자신의 클래스에 대한 수강신청 목록을 조회합니다.
 *     tags: [👨‍🏫 수강신청 - 강사용]
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
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: 상태 필터
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: 특정 클래스 필터
 *     responses:
 *       200:
 *         description: 클래스 수강신청 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Enrollment'
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
 *         description: 권한 없음 (강사가 아닌 경우)
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/my-classes', authenticateToken, async (req, res) => {
  // ... 기존 코드 ...
});

/**
 * @swagger
 * /enrollments/my-courses:
 *   get:
 *     summary: 내 코스의 수강신청 목록
 *     description: 강사가 자신의 코스에 대한 수강신청 목록을 조회합니다.
 *     tags: [👨‍🏫 수강신청 - 강사용]
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
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: 상태 필터
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: integer
 *         description: 특정 코스 필터
 *     responses:
 *       200:
 *         description: 코스 수강신청 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Enrollment'
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
 *         description: 권한 없음 (강사가 아닌 경우)
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/my-courses', authenticateToken, async (req, res) => {
  // ... 기존 코드 ...
});

/**
 * @swagger
 * /enrollments/{enrollmentId}/approve:
 *   put:
 *     summary: 수강신청 승인
 *     description: 강사가 자신의 클래스/코스에 대한 수강신청을 승인합니다.
 *     tags: [👨‍🏫 수강신청 - 강사용]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수강신청 ID
 *     responses:
 *       200:
 *         description: 수강신청 승인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *                   example: "수강신청이 승인되었습니다."
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
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
 *       404:
 *         description: 수강신청을 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.put('/:enrollmentId/approve', authenticateToken, async (req, res) => {
  // ... 기존 코드 ...
});

/**
 * @swagger
 * /enrollments/{enrollmentId}/reject:
 *   put:
 *     summary: 수강신청 거부
 *     description: 강사가 자신의 클래스/코스에 대한 수강신청을 거부합니다.
 *     tags: [👨‍🏫 수강신청 - 강사용]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 수강신청 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "수강 조건을 만족하지 않음"
 *                 description: 거부 사유 (선택사항)
 *     responses:
 *       200:
 *         description: 수강신청 거부 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *                   example: "수강신청이 거부되었습니다."
 *       400:
 *         description: 잘못된 요청
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
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
 *       404:
 *         description: 수강신청을 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.put('/:enrollmentId/reject', authenticateToken, async (req, res) => {
  // ... 기존 코드 ...
});

/**
 * @swagger
 * /enrollments/all:
 *   get:
 *     summary: 모든 수강신청 목록 조회 (관리자)
 *     description: 관리자가 모든 수강신청 목록을 조회합니다.
 *     tags: [🔧 수강신청 - 관리자용]
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
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled]
 *         description: 상태 필터
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: 특정 사용자 필터
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: 특정 클래스 필터
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: integer
 *         description: 특정 코스 필터
 *     responses:
 *       200:
 *         description: 모든 수강신청 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Enrollment'
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
 *         description: 권한 없음 (관리자가 아닌 경우)
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 접근할 수 있습니다.'
      });
    }
    
    const { page, limit, status, user_id, class_id, course_id } = req.query;
    const filters = { page, limit, status, user_id, class_id, course_id };
    
    const result = await enrollmentService.getEnrollments(filters);
    
    res.status(200).json({
      success: true,
      data: result.enrollments,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error('모든 수강신청 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 목록을 조회하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments/stats:
 *   get:
 *     summary: 수강신청 통계 조회 (관리자)
 *     description: 관리자가 수강신청 관련 통계를 조회합니다.
 *     tags: [🔧 수강신청 - 관리자용]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 수강신청 통계 조회 성공
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
 *                     total_enrollments:
 *                       type: integer
 *                       example: 150
 *                     active_enrollments:
 *                       type: integer
 *                       example: 100
 *                     completed_enrollments:
 *                       type: integer
 *                       example: 40
 *                     cancelled_enrollments:
 *                       type: integer
 *                       example: 10
 *                     avg_progress:
 *                       type: number
 *                       example: 67.5
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (관리자가 아닌 경우)
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticateToken, async (req, res) => {
  // ... 기존 코드 ...
});

module.exports = router; 