const { roomService } = require('../service/roomService');

// 응답 헬퍼 함수
function response(res, statusCode, result, data = '') {
  return res.status(statusCode).json({
    header: {
      result: statusCode,
      data: data
    },
    result: result
  });
}

// 컨트롤러 함수들
async function getRoomList(req, res) {
  try {
    const rooms = await roomService.getRoomList();
    return response(res, 200, rooms);
  } catch (error) {
    console.error('채팅방 목록 조회 실패:', error);
    return response(res, 500, error.message);
  }
}

async function createRoom(req, res) {
  try {
    // Log the incoming request body
    console.log('[Publisher Controller] Received /make-room request body:', req.body);
    
    const { name, userId } = req.body;
    
    if (!name) {
      return response(res, 422, '채팅방 이름이 필요합니다');
    }
    
    if (!userId) {
      return response(res, 422, '사용자 ID가 필요합니다');
    }
    
    await roomService.createRoom(name, userId);
    return response(res, 200, 'Success');
  } catch (error) {
    console.error('채팅방 생성 실패:', error);
    return response(res, 500, error.message);
  }
}

async function getRoom(req, res) {
  try {
    const { name } = req.query;
    
    if (!name) {
      return response(res, 422, '채팅방 이름이 필요합니다');
    }
    
    const room = await roomService.getRoom(name);
    return response(res, 200, room);
  } catch (error) {
    console.error('채팅방 조회 실패:', error);
    return response(res, 500, error.message);
  }
}

async function getServerList(req, res) {
  try {
    const servers = await roomService.getAvailableServers();
    const serverList = servers.map(server => server.ip);
    return response(res, 200, serverList);
  } catch (error) {
    console.error('서버 목록 조회 실패:', error);
    return response(res, 500, error.message);
  }
}

async function getChatList(req, res) {
  try {
    const { room } = req.query;
    
    if (!room) {
      return response(res, 422, '채팅방 이름이 필요합니다');
    }
    
    const chats = await roomService.getChatList(room);
    return response(res, 200, chats);
  } catch (error) {
    console.error('채팅 목록 조회 실패:', error);
    return response(res, 500, error.message);
  }
}

async function deleteRoom(req, res) {
  try {
    // Extract name and userId from request body
    const { name, userId } = req.body;
    console.log('[Publisher Controller] Received /delete-room request:', { name, userId }); // Log incoming request
    
    if (!name) {
      return response(res, 422, '채팅방 이름이 필요합니다');
    }
    
    // Add validation for userId if necessary
    if (!userId) {
        return response(res, 422, '사용자 ID가 필요합니다');
    }
    
    // Pass both name and userId to the service
    await roomService.deleteRoom(name, userId);
    return response(res, 200, 'Success');
  } catch (error) {
    console.error('채팅방 삭제 실패:', error);
    return response(res, 500, error.message);
  }
}

module.exports = {
  getRoomList,
  createRoom,
  getRoom,
  getServerList,
  getChatList,
  deleteRoom
}; 