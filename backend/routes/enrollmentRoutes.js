const express = require('express');
const EnrollmentService = require('../services/enrollmentService');
const { authenticateToken } = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();
const enrollmentService = new EnrollmentService();

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
 *         student_id:
 *           type: integer
 *           example: 1
 *         class_id:
 *           type: integer
 *           example: 1
 *         course_id:
 *           type: integer
 *           example: 1
 *         enrollment_type:
 *           type: string
 *           enum: [class, course]
 *           example: "class"
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, completed, cancelled]
 *           example: "approved"
 *         enrollment_date:
 *           type: string
 *           format: date-time
 *         completion_date:
 *           type: string
 *           format: date-time
 *         progress:
 *           type: integer
 *           example: 75
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
 */

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: 수강신청 목록 조회
 *     description: 수강신청 목록을 조회합니다. (학생은 자신의 수강신청만, 관리자는 모든 수강신청 조회 가능)
 *     tags: [Enrollments]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, cancelled]
 *         description: 수강신청 상태 필터
 *       - in: query
 *         name: enrollment_type
 *         schema:
 *           type: string
 *           enum: [class, course]
 *         description: 수강신청 타입 필터
 *     responses:
 *       200:
 *         description: 수강신청 목록 조회 성공
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
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, enrollment_type } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const result = await enrollmentService.getEnrollments(
      parseInt(page), 
      parseInt(limit), 
      status, 
      enrollment_type,
      userRole === 'admin' ? null : userId
    );
    
    res.status(200).json({
      success: true,
      data: result.enrollments,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('수강신청 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 목록을 조회하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: 수강신청 생성
 *     description: 새로운 수강신청을 생성합니다. (학생만 가능)
 *     tags: [Enrollments]
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
 *               class_id:
 *                 type: integer
 *                 example: 1
 *                 description: 오프라인 클래스 ID (enrollment_type이 class인 경우)
 *               course_id:
 *                 type: integer
 *                 example: 1
 *                 description: 온라인 코스 ID (enrollment_type이 course인 경우)
 *     responses:
 *       201:
 *         description: 수강신청 생성 성공
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
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { enrollment_type, class_id, course_id } = req.body;
    
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: '학생만 수강신청할 수 있습니다.'
      });
    }
    
    const enrollmentData = {
      student_id: req.user.id,
      enrollment_type,
      class_id: enrollment_type === 'class' ? class_id : null,
      course_id: enrollment_type === 'course' ? course_id : null
    };
    
    const newEnrollment = await enrollmentService.createEnrollment(enrollmentData);
    
    res.status(201).json({
      success: true,
      data: newEnrollment
    });
  } catch (error) {
    logger.error('수강신청 생성 실패:', error);
    res.status(400).json({
      success: false,
      message: error.message || '수강신청을 생성하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments/{enrollmentId}:
 *   get:
 *     summary: 수강신청 상세 조회
 *     description: 특정 수강신청의 상세 정보를 조회합니다.
 *     tags: [Enrollments]
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
 *         description: 수강신청 상세 조회 성공
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
router.get('/:enrollmentId', authenticateToken, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const enrollmentData = await enrollmentService.getEnrollmentById(enrollmentId);
    
    if (!enrollmentData) {
      return res.status(404).json({
        success: false,
        message: '수강신청을 찾을 수 없습니다.'
      });
    }
    
    // 권한 확인: 학생은 자신의 수강신청만, 관리자는 모든 수강신청 조회 가능
    if (req.user.role !== 'admin' && enrollmentData.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '수강신청 정보를 조회할 권한이 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: enrollmentData
    });
  } catch (error) {
    logger.error('수강신청 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments/{enrollmentId}:
 *   put:
 *     summary: 수강신청 상태 변경
 *     description: 수강신청 상태를 변경합니다. (관리자만 가능)
 *     tags: [Enrollments]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, completed, cancelled]
 *                 example: "approved"
 *     responses:
 *       200:
 *         description: 수강신청 상태 변경 성공
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
router.put('/:enrollmentId', authenticateToken, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const { status } = req.body;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '수강신청 상태를 변경할 권한이 없습니다.'
      });
    }
    
    const updatedEnrollment = await enrollmentService.updateEnrollmentStatus(enrollmentId, status);
    
    res.status(200).json({
      success: true,
      data: updatedEnrollment
    });
  } catch (error) {
    logger.error('수강신청 상태 변경 실패:', error);
    res.status(400).json({
      success: false,
      message: error.message || '수강신청 상태를 변경하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments/{enrollmentId}/review:
 *   post:
 *     summary: 수강 후기 작성
 *     description: 수강 완료 후 후기를 작성합니다. (수강생만 가능)
 *     tags: [Enrollments]
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - review
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               review:
 *                 type: string
 *                 example: "정말 좋은 강의였습니다!"
 *     responses:
 *       200:
 *         description: 후기 작성 성공
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
router.post('/:enrollmentId/review', authenticateToken, async (req, res) => {
  try {
    const enrollmentId = parseInt(req.params.enrollmentId);
    const { rating, review } = req.body;
    
    const enrollmentData = await enrollmentService.getEnrollmentById(enrollmentId);
    
    if (!enrollmentData) {
      return res.status(404).json({
        success: false,
        message: '수강신청을 찾을 수 없습니다.'
      });
    }
    
    if (enrollmentData.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '후기를 작성할 권한이 없습니다.'
      });
    }
    
    if (enrollmentData.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: '수강이 완료된 후에만 후기를 작성할 수 있습니다.'
      });
    }
    
    const updatedEnrollment = await enrollmentService.addReview(enrollmentId, rating, review);
    
    res.status(200).json({
      success: true,
      data: updatedEnrollment
    });
  } catch (error) {
    logger.error('후기 작성 실패:', error);
    res.status(400).json({
      success: false,
      message: error.message || '후기를 작성하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments/student/{studentId}:
 *   get:
 *     summary: 학생별 수강신청 목록
 *     description: 특정 학생의 수강신청 목록을 조회합니다.
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 학생 ID
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed, cancelled]
 *         description: 수강신청 상태 필터
 *     responses:
 *       200:
 *         description: 학생별 수강신청 목록 조회 성공
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
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const { page = 1, limit = 10, status } = req.query;
    
    // 권한 확인: 학생은 자신의 수강신청만, 관리자는 모든 학생의 수강신청 조회 가능
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({
        success: false,
        message: '다른 학생의 수강신청 정보를 조회할 권한이 없습니다.'
      });
    }
    
    const result = await enrollmentService.getEnrollmentsByStudent(studentId, parseInt(page), parseInt(limit), status);
    
    res.status(200).json({
      success: true,
      data: result.enrollments,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('학생별 수강신청 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '학생별 수강신청 목록을 조회하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /enrollments/stats:
 *   get:
 *     summary: 수강신청 통계 조회
 *     description: 수강신청 관련 통계를 조회합니다. (관리자만 가능)
 *     tags: [Enrollments]
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
 *                     pending_enrollments:
 *                       type: integer
 *                     approved_enrollments:
 *                       type: integer
 *                     completed_enrollments:
 *                       type: integer
 *                     class_enrollments:
 *                       type: integer
 *                     course_enrollments:
 *                       type: integer
 *                     average_rating:
 *                       type: number
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '통계를 조회할 권한이 없습니다.'
      });
    }
    
    const stats = await enrollmentService.getEnrollmentStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('수강신청 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 통계를 조회하는 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 