const express = require('express');
const ClassService = require('../services/classService');
const { authenticateToken, authorizeRole } = require('../middlewares/auth');
const logger = require('../utils/logger');

const router = express.Router();
const classService = new ClassService();

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
 *     Class:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 클래스 ID
 *         name:
 *           type: string
 *           description: 클래스 이름
 *         description:
 *           type: string
 *           description: 클래스 설명
 *         teacher_id:
 *           type: integer
 *           description: 강사 ID
 *         max_students:
 *           type: integer
 *           description: 최대 수강 인원
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: 시작일
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: 종료일
 *         schedule:
 *           type: string
 *           description: "수업 시간 (예: 매주 월,수 19:00-21:00)"
 *         location:
 *           type: string
 *           description: "수업 장소 (예: 서울시 강남구)"
 *         price:
 *           type: integer
 *           description: 수강료
 *         status:
 *           type: string
 *           enum: [pending, active, completed, canceled]
 *           description: "클래스 상태"
 *       example:
 *         id: 1
 *         name: "실전! 비즈니스 영어 회화"
 *         description: "비즈니스 상황에서 바로 사용하는 영어 회화 스킬을 배웁니다."
 *         teacher_id: 2
 *         max_students: 10
 *         start_date: "2024-09-01T10:00:00Z"
 *         end_date: "2024-11-30T12:00:00Z"
 *         schedule: "매주 화,목 20:00-22:00"
 *         location: "온라인 (Zoom)"
 *         price: 250000
 *         status: "active"
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
    const { page, limit, status, search } = req.query;
    const result = await classService.getClasses(page, limit, status, search);
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
 *             $ref: '#/components/schemas/Class'
 *     responses:
 *       201:
 *         description: 클래스 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Class'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 권한 없음
 */
router.post('/', authenticateToken, authorizeRole(['teacher']), async (req, res) => {
  try {
    const classData = { ...req.body, teacher_id: req.user.id };
    const newClass = await classService.createClass(classData);
    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    logger.error('클래스 생성 실패:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

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
 *             $ref: '#/components/schemas/Class'
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

    if (classToUpdate.teacher_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
    }

    const updatedClass = await classService.updateClass(classId, req.body);
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

    if (classToDelete.teacher_id !== req.user.id) {
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