const express = require('express');
const classService = require('../services/classService');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const logger = require('../utils/logger');
const asyncHandler = require('express-async-handler');

const router = express.Router();


/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: 클래스(오프라인 강의) 관리
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: 클래스 제목
 *         description:
 *           type: string
 *           description: 클래스 설명
 *         subject:
 *           type: string
 *           description: 과목
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           description: 난이도
 *         max_students:
 *           type: integer
 *           description: 최대 수강 인원
 *         price:
 *           type: number
 *           description: 수강료
 *         location:
 *           type: string
 *           description: 수업 장소
 *         schedule:
 *           type: string
 *           description: 수업 시간
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: 시작일
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: 종료일
 *       required:
 *         - title
 *       example:
 *         title: "실전! 비즈니스 영어 회화"
 *         description: "비즈니스 상황에서 바로 사용하는 영어 회화 스킬을 배웁니다."
 *         subject: "영어"
 *         level: "intermediate"
 *         max_students: 10
 *         price: 250000
 *         location: "서울시 강남구"
 *         schedule: "매주 화,목 20:00-22:00"
 *         start_date: "2024-09-01T10:00:00Z"
 *         end_date: "2024-11-30T12:00:00Z"
 *     Class:
 *       allOf:
 *         - $ref: '#/components/schemas/ClassInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: 클래스 ID (자동 생성)
 *             teacher_id:
 *               type: integer
 *               description: 강사 ID (토큰에서 자동 설정)
 *             current_students:
 *               type: integer
 *               description: 현재 수강 인원
 *             status:
 *               type: string
 *               enum: [active, inactive, completed, cancelled]
 *               description: 클래스 상태
 *             created_at:
 *               type: string
 *               format: date-time
 *             updated_at:
 *               type: string
 *               format: date-time
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: 클래스 목록 조회
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, canceled]
 *         description: 클래스 상태
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (이름, 설명)
 *     responses:
 *       200:
 *         description: 클래스 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *                 pagination:
 *                   type: object
 */
router.get('/', async (req, res) => {
  try {
    const { page, limit, status, search, subject, level, teacher_id } = req.query;
    const filters = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status: status || 'active',
      search: search ? search.trim() : null,
      subject: subject ? subject.trim() : null,
      level: level ? level.trim() : null,
      teacher_id: teacher_id ? parseInt(teacher_id) : null
    };
    
    const result = await classService.getClasses(filters);
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error('클래스 목록 조회 실패:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: 새 클래스 생성 (강사)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       201:
 *         description: 클래스 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 */
router.post('/', authenticateToken, authorizeRole(['teacher']), asyncHandler(async (req, res) => {
  const classData = {
    ...req.body,
    teacher_id: req.user.userId // 토큰에서 사용자 ID 가져오기
  };
  
  // 보안상 제거해야 할 필드들
  delete classData.id; // ID는 자동 생성
  delete classData.teacher_id_from_body; // 혹시 body에서 온 teacher_id
  delete classData.current_students; // 초기값은 0
  delete classData.created_at; // 자동 생성
  delete classData.updated_at; // 자동 생성
  
  const newClass = await classService.createClass(classData);
  
  res.status(201).json({
    success: true,
    data: newClass
  });
}));

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: 특정 클래스 조회
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 클래스 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       404:
 *         description: 클래스를 찾을 수 없음
 */
router.get('/:id', async (req, res) => {
  try {
    const classData = await classService.getClassById(req.params.id);
    if (classData) {
      res.json({ success: true, data: classData });
    } else {
      res.status(404).json({ success: false, message: '클래스를 찾을 수 없습니다.' });
    }
  } catch (error) {
    logger.error('클래스 조회 실패:', error);
    res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: 클래스 정보 수정 (강사)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClassInput'
 *     responses:
 *       200:
 *         description: 수정 성공
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 클래스를 찾을 수 없음
 */
router.put('/:id', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const classId = req.params.id;
    const classToUpdate = await classService.getClassById(classId);

    if (!classToUpdate) {
      return res.status(404).json({ success: false, message: '클래스를 찾을 수 없습니다.' });
    }

    if (classToUpdate.teacher_id !== req.user.userId) {
      return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
    }

    // 수정할 수 없는 필드들 제거
    const updateData = { ...req.body };
    delete updateData.id; // ID는 변경 불가
    delete updateData.teacher_id; // 강사 ID는 변경 불가
    delete updateData.current_students; // 수강생 수는 별도 로직으로 관리
    delete updateData.created_at; // 생성일은 변경 불가
    delete updateData.updated_at; // 수정일은 자동 업데이트

    const updatedClass = await classService.updateClass(classId, updateData);
    res.json({ success: true, data: updatedClass });
  } catch (error) {
    logger.error('클래스 수정 실패:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: 클래스 삭제 (강사)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 클래스를 찾을 수 없음
 */
router.delete('/:id', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const classId = req.params.id;
    const classToDelete = await classService.getClassById(classId);

    if (!classToDelete) {
      return res.status(404).json({ success: false, message: '클래스를 찾을 수 없습니다.' });
    }

    // 본인의 클래스인지 확인
    if (classToDelete.teacher_id !== req.user.userId) { // req.user.id -> req.user.userId
      return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
    }

    await classService.deleteClass(classId);
    res.json({ success: true, message: '클래스가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    logger.error('클래스 삭제 실패:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router; 