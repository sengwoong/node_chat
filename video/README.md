# Desktop Screen Recording & Live Streaming Application

Node.js 애플리케이션으로 데스크톱 화면을 녹화하고 동시에 실시간 스트리밍할 수 있습니다. 녹화된 영상은 MP4 형식으로 변환되어 다운로드할 수 있습니다.

## 필수 조건

- Node.js (v14+)
- FFmpeg 설치
  - Windows: [FFmpeg.org](https://ffmpeg.org/download.html)에서 다운로드 후 PATH에 추가
  - Mac: `brew install ffmpeg` 명령으로 설치
  - Linux: `apt-get install ffmpeg` 또는 유사한 명령으로 설치
- 화면 캡처 API를 지원하는 모던 브라우저 (Chrome, Firefox, Edge)

## 설치

1. 저장소 복제
2. 프로젝트 디렉토리로 이동
3. 의존성 설치:

```bash
npm install
```

## 디렉토리 구조

- `/app` - 서버 측 코드
- `/public` - 프론트엔드 HTML 및 클라이언트 측 JavaScript
- `/public/stream` - HLS 스트리밍 파일이 저장되는 위치
- `/recorded` - 변환된 MP4 비디오 (자동 생성)
- `/temp` - 업로드된 WebM 파일 임시 저장소 (자동 생성)

## 사용 방법

1. 서버 시작:

```bash
npm start
```

2. 브라우저에서 `http://localhost:8080` 접속
3. "화면 선택" 버튼을 클릭하고 녹화할 화면, 창 또는 탭 선택
4. "녹화 시작" 버튼을 클릭하여 녹화 시작
5. 녹화가 시작되면 QR 코드를 포함한 실시간 스트리밍 정보가 표시됨
6. 스트리밍 링크를 다른 기기나 사람과 공유하여 실시간으로 화면 공유
7. "녹화 중지" 버튼을 클릭하여 녹화 중지
8. 녹화된 비디오는 MP4로 변환되어 자동 다운로드

## 중요: 포트 사용에 관한 안내

이 애플리케이션은 8080 포트에서 실행됩니다. 다음 사항에 주의하세요:

- 브라우저에서 반드시 `http://localhost:8080`으로 접속하세요.
- Live Server 등 다른 개발 서버(일반적으로 5500 포트 사용)로 파일을 직접 열지 마세요.
- 포트 충돌 오류가 발생하면 `app/server.js` 파일에서 포트 번호를 변경할 수 있습니다.

## 기능

- 데스크톱 화면 녹화
- 실시간 HLS 스트리밍 (HTTP Live Streaming)
- WebM에서 MP4로 변환 (FFmpeg 사용)
- 녹화 완료 후 자동 파일 다운로드
- 모바일 접속을 위한 QR 코드 생성
- 과정 중 상태 업데이트

## 기술 스택

- Node.js와 Express
- 파일 업로드를 위한 Multer
- 비디오 변환 및 스트리밍을 위한 Fluent-FFmpeg
- 화면 녹화를 위한 브라우저 getDisplayMedia API
- 실시간 스트리밍을 위한 HLS (HTTP Live Streaming)
- HLS 비디오 재생을 위한 hls.js

## 문제 해결

### "405 Method Not Allowed" 또는 포트 관련 오류

오류 메시지: `스트리밍 시작 실패: 서버 응답 오류: 405`

- **원인**: 서버는 8080 포트에서 실행 중이지만, 클라이언트가 다른 포트(예: 5500)로 요청을 보내는 경우
- **해결 방법**: 
  1. 브라우저에서 직접 `http://localhost:8080`으로 접속하세요.
  2. 파일을 Live Server나 다른 방법으로 열지 마세요.

### 스트림 로딩 오류

- 서버가 실행 중인지 확인하세요.
- 터미널에 오류 메시지가 있는지 확인하세요.
- FFmpeg가 올바르게 설치되었는지 확인하세요.
- 방화벽이나 보안 소프트웨어가 스트리밍을 차단하지 않는지 확인하세요.

### 기타 문제

- 모바일에서 스트리밍을 볼 때는 최신 버전의 브라우저 사용을 권장합니다.
- 녹화 품질 문제는 `server.js`의 FFmpeg 옵션을 조정하여 해결 가능합니다. 