# 🚀 Unified Backend Service

통합된 백엔드 서비스로 채팅, 비디오 스트리밍, WebRTC, 강의 관리 기능을 제공합니다.

## 📋 주요 기능

### 💬 채팅 (Chat)
- 실시간 채팅 메시지 전송
- 방별 메시지 분리
- 사용자 입장/퇴장 알림
- 메시지 영속성 (Kafka + MySQL)
- 채팅방 관리 (생성/삭제)

### 🎥 비디오 (Video)
- 비디오 업로드 및 변환 (FFmpeg)
- 실시간 스트리밍 (HLS)
- 라이브 스트리밍
- 비디오 메타데이터 관리
- 다운로드 기능

### 📹 WebRTC (RTC)
- 실시간 화상 통화
- 화면 공유
- 다중 참가자 지원
- 시그널링 서버
- TURN 서버 지원

### 📚 강의 (Lecture)
- 강의 CRUD 관리
- 강의 상태 관리 (초안/발행/보관)
- 좋아요/싫어요 기능
- 댓글 시스템
- 조회수 통계

## 🏗️ 아키텍처

```
/backend
├── 📁 rtc/                  # WebRTC 관련 백엔드 로직
│   ├── signalingServer.js   # WebRTC 시그널링 서버
│   ├── rtcController.js     # RTC API 컨트롤러
│   ├── rtcService.js        # RTC 비즈니스 로직
│   └── rtcRoutes.js         # RTC 라우트
│
├── 📁 video/                # 영상 관리 및 스트리밍 관련
│   ├── videoController.js   # 비디오 API 컨트롤러
│   ├── videoService.js      # 비디오 비즈니스 로직
│   └── videoRoutes.js       # 비디오 라우트
│
├── 📁 lecture/              # 강의 CRUD 관리
│   ├── lectureModel.js      # 강의 데이터 모델
│   ├── lectureController.js # 강의 API 컨트롤러
│   ├── lectureService.js    # 강의 비즈니스 로직
│   └── lectureRoutes.js     # 강의 라우트
│
├── 📁 chat/                 # 채팅 서버
│   ├── chatServer.js        # Socket.IO 채팅 서버
│   ├── chatHandler.js       # 채팅 이벤트 핸들러
│   ├── chatUtils.js         # 채팅 유틸리티
│   └── chatRoutes.js        # 채팅 REST API
│
├── 📁 config/               # 환경설정
│   ├── db.js               # 데이터베이스 설정
│   ├── env.js              # 환경 변수
│   ├── kafka.js            # Kafka 설정
│   └── constants.js        # 공통 상수
│
├── 📁 utils/                # 공통 유틸 함수
│   └── logger.js           # 로깅 유틸리티
│
├── 📁 middlewares/         # 공통 미들웨어
│   ├── auth.js            # 인증 미들웨어
│   └── errorHandler.js    # 에러 처리 미들웨어
│
├── 📁 routes/              # 전체 라우트 통합
│   └── index.js           # 메인 라우트
│
└── server.js              # 백엔드 진입점
```

## 🛠️ 기술 스택

### Backend
- **Node.js** + **Express.js** - 웹 서버 프레임워크
- **Socket.IO** - 실시간 통신
- **WebSocket** - WebRTC 시그널링
- **MySQL** - 관계형 데이터베이스
- **Kafka** - 메시지 큐
- **FFmpeg** - 비디오 처리
- **JWT** - 인증 토큰

### Security & Monitoring
- **Helmet** - 보안 헤더
- **Rate Limiting** - 요청 제한
- **Winston** - 로깅
- **CORS** - 크로스 오리진 설정

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 설정을 입력
```

### 3. 데이터베이스 설정
```bash
# MySQL이 실행 중인지 확인
# docker-compose.yml을 사용하여 인프라 실행
docker-compose up -d
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📡 API 엔드포인트

### 헬스 체크
- `GET /api/health` - 서버 상태 확인
- `GET /api/version` - API 버전 정보
- `GET /api/status` - 서버 상세 상태

### 채팅 API
- `GET /api/chat/rooms` - 채팅방 목록
- `POST /api/chat/rooms` - 채팅방 생성
- `GET /api/chat/rooms/:roomId` - 채팅방 정보
- `GET /api/chat/rooms/:roomId/messages` - 메시지 목록

### RTC API
- `POST /api/rtc/rooms` - RTC 방 생성
- `GET /api/rtc/rooms` - RTC 방 목록
- `GET /api/rtc/rooms/:roomId` - RTC 방 정보
- `POST /api/rtc/token` - 연결 토큰 생성

### 비디오 API
- `POST /api/video/upload` - 비디오 업로드
- `GET /api/video/videos` - 비디오 목록
- `GET /api/video/videos/:videoId` - 비디오 정보
- `POST /api/video/stream/start` - 스트리밍 시작

### 강의 API
- `POST /api/lecture` - 강의 생성
- `GET /api/lecture` - 강의 목록
- `GET /api/lecture/:lectureId` - 강의 상세
- `PUT /api/lecture/:lectureId` - 강의 수정

## 🔧 WebSocket 이벤트

### 채팅 이벤트
- `join_room` - 방 입장
- `leave_room` - 방 퇴장
- `message` - 메시지 전송
- `user_joined` - 사용자 입장 알림
- `user_left` - 사용자 퇴장 알림

### RTC 이벤트
- `join-room` - RTC 방 입장
- `leave-room` - RTC 방 퇴장
- `offer` - WebRTC Offer
- `answer` - WebRTC Answer
- `ice-candidate` - ICE Candidate

## 📊 모니터링

### 로그
- 로그 파일: `logs/combined.log`, `logs/error.log`
- 로그 레벨: `info`, `warn`, `error`

### 메트릭
- 서버 상태: `GET /api/status`
- RTC 통계: `GET /api/rtc/stats`
- 채팅 통계: `GET /api/chat/stats`

## 🔒 보안

### 인증
- JWT 토큰 기반 인증
- 토큰 만료 시간 설정
- 역할 기반 권한 제어

### 보안 헤더
- Helmet.js를 통한 보안 헤더 설정
- CORS 정책 설정
- Rate Limiting 적용

## 🐳 Docker 지원

```bash
# Docker 이미지 빌드
docker build -t unified-backend .

# Docker 컨테이너 실행
docker run -p 3000:3000 unified-backend
```

## 📝 개발 가이드

### 새로운 모듈 추가
1. 해당 모듈 디렉토리 생성
2. Model, Service, Controller, Routes 파일 생성
3. `routes/index.js`에 라우트 등록
4. 필요한 경우 데이터베이스 스키마 추가

### 에러 처리
- `middlewares/errorHandler.js`에서 전역 에러 처리
- `asyncHandler` 래퍼 사용으로 비동기 에러 처리
- 적절한 HTTP 상태 코드 반환

### 로깅
- `utils/logger.js` 사용
- 구조화된 로그 메시지 작성
- 에러 로그에 상세 정보 포함

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요. 