const express = require('express');
const { authenticateToken, optionalAuth } = require('../middlewares/auth');
const { asyncHandler } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const constants = require('../config/constants');
const chatService = require('./chatService');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ChatRoom:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "일반 채팅방"
 *         description:
 *           type: string
 *           example: "일반적인 대화를 나누는 방입니다"
 *         creator_id:
 *           type: integer
 *           example: 1
 *         creator_name:
 *           type: string
 *           example: "관리자"
 *         is_private:
 *           type: boolean
 *           example: false
 *         max_participants:
 *           type: integer
 *           example: 50
 *         participant_count:
 *           type: integer
 *           example: 5
 *         created_at:
 *           type: string
 *           format: date-time
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         room_id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: "사용자1"
 *         message:
 *           type: string
 *           example: "안녕하세요!"
 *         message_type:
 *           type: string
 *           example: "text"
 *         created_at:
 *           type: string
 *           format: date-time
 *     ChatParticipant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         room_id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: "사용자1"
 *         joined_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /chat/rooms:
 *   get:
 *     summary: 채팅방 목록 조회
 *     description: 사용 가능한 채팅방 목록을 조회합니다.
 *     tags: [Chat]
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
 *         description: 페이지당 방 수
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어
 *     responses:
 *       200:
 *         description: 채팅방 목록
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
 *                     rooms:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatRoom'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/rooms', optionalAuth, asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const filters = { page: parseInt(page) || 1, limit: parseInt(limit) || 20, search };
  
  const result = await chatService.getRooms(filters);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
}));

/**
 * @swagger
 * /chat/rooms:
 *   post:
 *     summary: 채팅방 생성
 *     description: 새로운 채팅방을 생성합니다. 인증이 필요합니다.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "새로운 채팅방"
 *               description:
 *                 type: string
 *                 example: "채팅방 설명"
 *               isPrivate:
 *                 type: boolean
 *                 example: false
 *               maxParticipants:
 *                 type: integer
 *                 example: 50
 *     responses:
 *       201:
 *         description: 채팅방 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatRoom'
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
 */
router.post('/rooms', authenticateToken, asyncHandler(async (req, res) => {
  const { name, description, isPrivate, maxParticipants } = req.body;
  const userId = req.user.userId;
  
  if (!name) {
    return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: '방 이름이 필요합니다'
    });
  }
  
  const roomData = {
    name,
    description,
    creatorId: userId,
    isPrivate: isPrivate || false,
    maxParticipants: maxParticipants || 50
  };
  
  const newRoom = await chatService.createRoom(roomData);
  
  res.status(constants.HTTP_STATUS.CREATED).json({
    success: true,
    data: newRoom
  });
}));

/**
 * @swagger
 * /chat/rooms/{roomId}:
 *   get:
 *     summary: 채팅방 정보 조회
 *     description: 특정 채팅방의 정보를 조회합니다.
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 채팅방 정보
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatRoom'
 *       404:
 *         description: 채팅방을 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.get('/rooms/:roomId', optionalAuth, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  const room = await chatService.getRoomById(parseInt(roomId));
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: room
  });
}));

/**
 * @swagger
 * /chat/rooms/{roomId}/join:
 *   post:
 *     summary: 채팅방 참가
 *     description: 채팅방에 참가합니다. 인증이 필요합니다.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 채팅방 참가 성공
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
 *                   example: "채팅방에 참가했습니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 *       404:
 *         description: 채팅방을 찾을 수 없음
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post('/rooms/:roomId/join', authenticateToken, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;
  
  await chatService.joinRoom(parseInt(roomId), userId);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    message: '채팅방에 참가했습니다'
  });
}));

/**
 * @swagger
 * /chat/rooms/{roomId}/leave:
 *   post:
 *     summary: 채팅방 나가기
 *     description: 채팅방에서 나갑니다. 인증이 필요합니다.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 채팅방 나가기 성공
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
 *                   example: "채팅방에서 나갔습니다"
 *       401:
 *         description: 인증 실패
 *         content:
 *           application/json:
 *             $ref: '#/components/schemas/Error'
 */
router.post('/rooms/:roomId/leave', authenticateToken, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;
  
  await chatService.leaveRoom(parseInt(roomId), userId);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    message: '채팅방에서 나갔습니다'
  });
}));

/**
 * @swagger
 * /chat/rooms/{roomId}/messages:
 *   get:
 *     summary: 채팅 메시지 목록 조회
 *     description: 특정 채팅방의 메시지 목록을 조회합니다.
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
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
 *           default: 50
 *         description: 페이지당 메시지 수
 *       - in: query
 *         name: beforeId
 *         schema:
 *           type: integer
 *         description: 특정 메시지 ID 이전의 메시지들 조회
 *     responses:
 *       200:
 *         description: 메시지 목록
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatMessage'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/rooms/:roomId/messages', optionalAuth, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { page, limit, beforeId } = req.query;
  
  const filters = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
    beforeId: beforeId ? parseInt(beforeId) : undefined
  };
  
  const result = await chatService.getMessages(parseInt(roomId), filters);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: result
  });
}));

/**
 * @swagger
 * /chat/rooms/{roomId}/participants:
 *   get:
 *     summary: 채팅방 참가자 목록 조회
 *     description: 특정 채팅방의 참가자 목록을 조회합니다.
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 참가자 목록
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
 *                     $ref: '#/components/schemas/ChatParticipant'
 */
router.get('/rooms/:roomId/participants', optionalAuth, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  const participants = await chatService.getParticipants(parseInt(roomId));
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    data: participants
  });
}));

/**
 * @swagger
 * /chat/rooms/{roomId}:
 *   delete:
 *     summary: 채팅방 삭제
 *     description: 채팅방을 삭제합니다. 방 생성자만 삭제할 수 있습니다.
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 채팅방 삭제 성공
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
 *                   example: "채팅방이 삭제되었습니다"
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
router.delete('/rooms/:roomId', authenticateToken, asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.userId;
  
  await chatService.deleteRoom(parseInt(roomId), userId);
  
  res.status(constants.HTTP_STATUS.OK).json({
    success: true,
    message: '채팅방이 삭제되었습니다'
  });
}));

module.exports = router; 