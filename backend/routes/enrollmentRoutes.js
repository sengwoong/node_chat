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
  try {
    const { page = 1, limit = 20, type, subject, level } = req.query;
    
    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      subject,
      level
    };

    const result = await enrollmentService.getAvailableItems(filters);

    res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    logger.error('수강신청 가능 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 가능 목록을 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
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
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const filters = {
      user_id: req. user.userId,
      page: parseInt(page),
      limit: parseInt(limit),
      status
    };

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
    logger.error('내 수강신청 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 목록을 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
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
  try {
    const { enrollment_type, class_id, course_id } = req.body;
    
    // 학생 권한 확인
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: '학생만 수강신청할 수 있습니다.'
      });
    }

    // 필수 필드 검증
    if (!enrollment_type) {
      return res.status(400).json({
        success: false,
        message: 'enrollment_type은 필수입니다.'
      });
    }

    // enrollment_type 유효성 검증
    if (!['class', 'course'].includes(enrollment_type)) {
      return res.status(400).json({
        success: false,
        message: 'enrollment_type은 class 또는 course여야 합니다.'
      });
    }

    // class 타입 검증
    if (enrollment_type === 'class') {
      if (!class_id) {
        return res.status(400).json({
          success: false,
          message: 'class 타입의 경우 class_id가 필요합니다.'
        });
      }
      if (course_id) {
        return res.status(400).json({
          success: false,
          message: 'class 타입의 경우 course_id는 필요하지 않습니다.'
        });
      }
    }

    // course 타입 검증
    if (enrollment_type === 'course') {
      if (!course_id) {
        return res.status(400).json({
          success: false,
          message: 'course 타입의 경우 course_id가 필요합니다.'
        });
      }
      if (class_id) {
        return res.status(400).json({
          success: false,
          message: 'course 타입의 경우 class_id는 필요하지 않습니다.'
        });
      }
    }

    // 수강신청 데이터 구성
    const enrollmentData = {
      user_id: req. user.userId,
      enrollment_type,
      class_id: enrollment_type === 'class' ? parseInt(class_id) : null,
      course_id: enrollment_type === 'course' ? parseInt(course_id) : null,
      status: 'active',
      enrolled_at: new Date()
    };

    // 수강신청 생성
    const enrollment = await enrollmentService.createEnrollment(enrollmentData);

    res.status(201).json({
      success: true,
      data: enrollment,
      message: '수강신청이 완료되었습니다.'
    });

  } catch (error) {
    logger.error('수강신청 생성 실패:', error);
    
    // 중복 수강신청 에러 처리
    if (error.message && error.message.includes('이미 수강신청')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // 존재하지 않는 클래스/코스 에러 처리
    if (error.message && error.message.includes('존재하지 않는')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    // 정원 초과 에러 처리
    if (error.message && error.message.includes('정원')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // 기타 에러
    res.status(500).json({
      success: false,
      message: error.message || '수강신청 중 오류가 발생했습니다.'
    });
  }
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
  try {
    // 즉시 응답하여 라우트가 작동하는지 확인
    return res.status(200).json({
      success: true,
      message: "라우트 테스트 성공!",
    

      user: req.user ? { id: req.user.userId, role: req.user.role } : null,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('에러:', error);
    return res.status(500).json({
      success: false,
      message: '오류 발생',
      error: error.message
    });
  }
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
  try {
    const { enrollmentId } = req.params;
    
    // 강사 권한 확인
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '강사만 접근할 수 있습니다.'
      });
    }

    // 수강신청 정보 조회 및 권한 확인
    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);
    
    // 강사가 자신의 클래스/코스인지 확인
    const isOwner = (enrollment.class && enrollment.class.teacher_id === req. user.userId) ||
                   (enrollment.course && enrollment.course.teacher_id === req. user.userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '자신의 클래스/코스에 대한 수강신청만 승인할 수 있습니다.'
      });
    }

    // 수강신청 승인 (상태를 active로 변경)
    const updatedEnrollment = await enrollmentService.updateEnrollmentStatus(
      enrollmentId, 
      'active'
    );

    res.status(200).json({
      success: true,
      data: updatedEnrollment,
      message: '수강신청이 승인되었습니다.'
    });
  } catch (error) {
    logger.error('수강신청 승인 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 승인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
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
  try {
    const { enrollmentId } = req.params;
    const { reason } = req.body;
    
    // 강사 권한 확인
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: '강사만 접근할 수 있습니다.'
      });
    }

    // 수강신청 정보 조회 및 권한 확인
    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);
    
    // 강사가 자신의 클래스/코스인지 확인
    const isOwner = (enrollment.class && enrollment.class.teacher_id === req. user.userId) ||
                   (enrollment.course && enrollment.course.teacher_id === req. user.userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '자신의 클래스/코스에 대한 수강신청만 거부할 수 있습니다.'
      });
    }

    // 수강신청 거부 (상태를 cancelled로 변경)
    const updatedEnrollment = await enrollmentService.updateEnrollmentStatus(
      enrollmentId, 
      'cancelled'
    );

    // 거부 사유가 있다면 로그에 기록
    if (reason) {
      logger.info(`수강신청 거부 - ID: ${enrollmentId}, 사유: ${reason}`);
    }

    res.status(200).json({
      success: true,
      data: updatedEnrollment,
      message: '수강신청이 거부되었습니다.'
    });
  } catch (error) {
    logger.error('수강신청 거부 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 거부 중 오류가 발생했습니다.',
      error: error.message
    });
  }
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
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자만 접근할 수 있습니다.'
      });
    }

    const result = await enrollmentService.getEnrollmentStats();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('수강신청 통계 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '수강신청 통계를 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 