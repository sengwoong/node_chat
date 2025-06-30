const express = require('express');
const courseService = require('../services/courseService');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();


const UserService = require('../services/userService');

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - subject
 *         - price
 *         - duration
 *         - level
 *       properties:
 *         title:
 *           type: string
 *           example: "React 완전 정복"
 *         description:
 *           type: string
 *           example: "React의 모든 것을 배우는 온라인 강의"
 *         subject:
 *           type: string
 *           example: "프로그래밍"
 *         price:
 *           type: number
 *           example: 150000
 *         duration:
 *           type: integer
 *           example: 120
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           example: "intermediate"
 *         thumbnail_url:
 *           type: string
 *           example: "https://example.com/thumbnail.jpg"
 *         video_url:
 *           type: string
 *           example: "https://example.com/video.mp4"
 *         preview_url:
 *           type: string
 *           example: "https://example.com/preview.mp4"
 *     Course:
 *       allOf:
 *         - $ref: '#/components/schemas/CourseInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: 코스 ID (자동 생성)
 *             teacher_id:
 *               type: integer
 *               description: 강사 ID (토큰에서 자동 설정)
 *             status:
 *               type: string
 *               enum: [draft, published, archived]
 *               description: 코스 상태
 *             view_count:
 *               type: integer
 *               description: 조회수
 *             rating:
 *               type: number
 *               description: 평점
 *             created_at:
 *               type: string
 *               format: date-time
 *             updated_at:
 *               type: string
 *               format: date-time
 *     CourseSection:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         course_id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "React 기초"
 *         description:
 *           type: string
 *           example: "React의 기본 개념을 배웁니다"
 *         order_index:
 *           type: integer
 *           example: 1
 *         video_url:
 *           type: string
 *           example: "https://example.com/video.mp4"
 *         duration:
 *           type: integer
 *           example: 30
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: 코스 목록 조회
 *     description: 온라인 코스 목록을 조회합니다.
 *     tags: [Courses]
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
 *           enum: [draft, published, archived]
 *         description: 코스 상태 필터
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: 난이도 필터
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *         description: 과목 필터
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (제목, 설명)
 *     responses:
 *       200:
 *         description: 코스 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Course'
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
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, level, subject, search } = req.query;
    const result = await courseService.getCourses(parseInt(page), parseInt(limit), status, level, subject, search);
    
    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('코스 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '코스 목록을 조회하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: 코스 생성
 *     description: 새로운 온라인 코스를 생성합니다. (강사만 가능)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       201:
 *         description: 코스 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
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
router.post('/', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const courseData = {
      ...req.body,
      teacher_id: req.user.userId
    };
    
    delete courseData.id;
    delete courseData.created_at;
    delete courseData.updated_at;
    
    const newCourse = await courseService.createCourse(courseData);
    
    res.status(201).json({
      success: true,
      data: newCourse
    });
  } catch (error) {
    logger.error('코스 생성 실패:', error);
    res.status(400).json({
      success: false,
      message: error.message || '코스를 생성하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /courses/{courseId}:
 *   get:
 *     summary: 코스 상세 조회
 *     description: 특정 코스의 상세 정보를 조회합니다.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 코스 ID
 *     responses:
 *       200:
 *         description: 코스 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: 코스를 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const courseData = await courseService.getCourseById(courseId);
    
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: '코스를 찾을 수 없습니다.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: courseData
    });
  } catch (error) {
    logger.error('코스 상세 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '코스 정보를 조회하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /courses/{courseId}:
 *   put:
 *     summary: 코스 수정
 *     description: 코스 정보를 수정합니다. (코스 생성자만 가능)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 코스 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: integer
 *               duration:
 *                 type: integer
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               subject:
 *                 type: string
 *               thumbnail_url:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: 코스 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       403:
 *         description: 권한 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       404:
 *         description: 코스를 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.put('/:courseId', authenticateToken, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const courseData = await courseService.getCourseById(courseId);
    
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: '코스를 찾을 수 없습니다.'
      });
    }
    
    logger.info('코스 수정 권한 확인:', {
      courseId: courseId,
      courseTeacherId: courseData.teacher_id,
      courseTeacherIdType: typeof courseData.teacher_id,
      tokenUserId: req.user.userId,
      tokenUserIdType: typeof req.user.userId,
      tokenUser: req.user
    });
    
    if (parseInt(courseData.teacher_id) !== parseInt(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: '코스를 수정할 권한이 없습니다.',
        debug: {
          courseTeacherId: courseData.teacher_id,
          tokenUserId: req.user.userId
        }
      });
    }
    
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.teacher_id;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const updatedCourse = await courseService.updateCourse(courseId, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedCourse
    });
  } catch (error) {
    logger.error('코스 수정 실패:', error);
    res.status(400).json({
      success: false,
      message: error.message || '코스를 수정하는 중 오류가 발생했습니다.'
    });
  }
});

/**
 * @swagger
 * /courses/teacher/{teacherId}:
 *   get:
 *     summary: 강사별 코스 목록
 *     description: 특정 강사의 코스 목록을 조회합니다.
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 강사 ID
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
 *     responses:
 *       200:
 *         description: 강사별 코스 목록 조회 성공
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
 *                     $ref: '#/components/schemas/Course'
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
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const teacherId = parseInt(req.params.teacherId);
    const { page = 1, limit = 10 } = req.query;
    const result = await courseService.getCoursesByTeacher(teacherId, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: result.courses,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('강사별 코스 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      message: '강사별 코스 목록을 조회하는 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router; 