const roomService = require('../services/roomService');

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

module.exports = {
  getServerList
}; 