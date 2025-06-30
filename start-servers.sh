#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Docker 사용 여부 확인
check_docker() {
    if [ -f "docker-compose.yml" ] && command -v docker-compose >/dev/null 2>&1; then
        log_info "Docker Compose 파일이 발견되었습니다"
        return 0
    else
        log_info "Docker를 사용하지 않습니다"
        return 1
    fi
}

# Docker MySQL 시작
start_docker_mysql() {
    log_info "🐳 Docker MySQL 서비스 시작 중..."
    
    if docker-compose up -d mysql; then
        log_info "Docker MySQL 서비스가 시작되었습니다"
        log_info "MySQL이 완전히 시작될 때까지 대기 중..."
        sleep 30
        return 0
    else
        log_error "Docker MySQL 서비스 시작 실패"
        return 1
    fi
}

# 데이터베이스 초기화 함수 (Docker용)
init_database_docker() {
    log_info "🗄️ 데이터베이스 초기화 중 (Docker MySQL)..."
    
    # Docker exec을 통한 초기화 (권장)
    if docker exec -i mysql mysql -u root -proot < init-db/init.sql; then
        log_info "✅ 데이터베이스 초기화 완료"
        return 0
    else
        log_warn "Docker exec 방법 실패, TCP 연결 시도..."
        # TCP 연결 시도
        if mysql -h 127.0.0.1 -P 3307 -u root -proot --protocol=TCP < init-db/init.sql; then
            log_info "✅ 데이터베이스 초기화 완료"
            return 0
        else
            log_error "❌ 데이터베이스 초기화 실패"
            return 1
        fi
    fi
}

# 데이터베이스 초기화 함수 (로컬용)
init_database_local() {
    log_info "🗄️ 데이터베이스 초기화 중 (로컬 MySQL)..."
    
    if mysql -u root -p < init-db/init.sql; then
        log_info "✅ 데이터베이스 초기화 완료"
        return 0
    else
        log_error "❌ 데이터베이스 초기화 실패"
        return 1
    fi
}

# 데이터베이스 존재 확인 함수 (Docker용)
check_database_docker() {
    # Docker exec을 통한 확인
    if docker exec mysql mysql -u root -proot -e "USE chatting; SHOW TABLES;" >/dev/null 2>&1; then
        log_info "✅ 데이터베이스가 이미 존재합니다"
        return 0
    else
        log_warn "⚠️ 데이터베이스가 존재하지 않거나 접근할 수 없습니다"
        return 1
    fi
}

# 데이터베이스 존재 확인 함수 (로컬용)
check_database_local() {
    if mysql -u root -p -e "USE chatting; SHOW TABLES;" >/dev/null 2>&1; then
        log_info "✅ 데이터베이스가 이미 존재합니다"
        return 0
    else
        log_warn "⚠️ 데이터베이스가 존재하지 않거나 접근할 수 없습니다"
        return 1
    fi
}

# Docker 사용 여부 확인
USE_DOCKER=false
if check_docker; then
    USE_DOCKER=true
fi

# 데이터베이스 초기화 로직
if [ "$USE_DOCKER" = true ]; then
    # Docker 모드
    log_info "🐳 Docker 모드로 실행합니다"
    
    # Docker MySQL 서비스 시작
    if ! start_docker_mysql; then
        log_error "Docker MySQL 서비스 시작에 실패했습니다"
        exit 1
    fi
    
    if [ "$INIT_DB" = "true" ]; then
        log_info "🔄 강제 데이터베이스 초기화 모드"
        if ! init_database_docker; then
            log_error "데이터베이스 초기화에 실패했습니다. 스크립트를 종료합니다."
            exit 1
        fi
    elif [ "$RESET_DB" = "true" ]; then
        log_info "🔄 데이터베이스 완전 재설정 모드"
        log_warn "기존 데이터가 모두 삭제됩니다!"
        mysql -h localhost -P 3307 -u root -proot -e "DROP DATABASE IF EXISTS chatting;"
        if ! init_database_docker; then
            log_error "데이터베이스 재설정에 실패했습니다. 스크립트를 종료합니다."
            exit 1
        fi
    else
        # 데이터베이스 존재 확인
        if ! check_database_docker; then
            log_info "데이터베이스를 초기화합니다..."
            if ! init_database_docker; then
                log_error "데이터베이스 초기화에 실패했습니다. 스크립트를 종료합니다."
                exit 1
            fi
        fi
    fi
else
    # 로컬 모드
    log_info "🏠 로컬 MySQL 모드로 실행합니다"
    
    if [ "$INIT_DB" = "true" ]; then
        log_info "🔄 강제 데이터베이스 초기화 모드"
        if ! init_database_local; then
            log_error "데이터베이스 초기화에 실패했습니다. 스크립트를 종료합니다."
            exit 1
        fi
    elif [ "$RESET_DB" = "true" ]; then
        log_info "🔄 데이터베이스 완전 재설정 모드"
        log_warn "기존 데이터가 모두 삭제됩니다!"
        mysql -u root -p -e "DROP DATABASE IF EXISTS chatting;"
        if ! init_database_local; then
            log_error "데이터베이스 재설정에 실패했습니다. 스크립트를 종료합니다."
            exit 1
        fi
    else
        # 데이터베이스 존재 확인
        if ! check_database_local; then
            log_info "데이터베이스를 초기화합니다..."
            if ! init_database_local; then
                log_error "데이터베이스 초기화에 실패했습니다. 스크립트를 종료합니다."
                exit 1
            fi
        fi
    fi
fi

# 서버 종료 함수
cleanup() {
    log_info "서버 종료 신호를 받았습니다. 정리 작업을 시작합니다..."
    
    if [ ! -z "$MAIN_PID" ]; then
        log_info "메인 서버 종료 중... (PID: $MAIN_PID)"
        kill $MAIN_PID 2>/dev/null
    fi
    
    if [ ! -z "$SUB_PID" ]; then
        log_info "서브 서버 종료 중... (PID: $SUB_PID)"
        kill $SUB_PID 2>/dev/null
    fi
    
    # 5초 대기 후 강제 종료
    sleep 5
    
    if [ ! -z "$MAIN_PID" ] && kill -0 $MAIN_PID 2>/dev/null; then
        log_warn "메인 서버 강제 종료..."
        kill -9 $MAIN_PID 2>/dev/null
    fi
    
    if [ ! -z "$SUB_PID" ] && kill -0 $SUB_PID 2>/dev/null; then
        log_warn "서브 서버 강제 종료..."
        kill -9 $SUB_PID 2>/dev/null
    fi
    
    log_info "모든 서버가 종료되었습니다."
    exit 0
}

# 시그널 핸들러 등록
trap cleanup SIGINT SIGTERM

# 환경 변수 설정
export NODE_ENV=${NODE_ENV:-development}
export PORT=${PORT:-3000}
export SUB_PORT=${SUB_PORT:-3001}

# 디렉토리 확인
if [ ! -d "backend" ]; then
    log_error "backend 디렉토리를 찾을 수 없습니다."
    exit 1
fi

# 의존성 설치 확인
if [ ! -d "backend/node_modules" ]; then
    log_warn "backend/node_modules가 없습니다. 의존성을 설치합니다..."
    cd backend
    npm install bcrypt@5.1.0
    cd ..
fi

# 환경 변수 파일 확인
if [ ! -f "backend/.env" ]; then
    log_warn "backend/.env 파일이 없습니다. .env.example을 복사합니다..."
    cd backend
    cp .env.example .env
    cd ..
fi

# 로그 디렉토리 생성
mkdir -p backend/logs

log_info "🚀 통합 백엔드 서버 시작 중..."
log_info "📁 작업 디렉토리: $(pwd)"
log_info "🌍 환경: $NODE_ENV"
log_info "🔗 메인 서버 포트: $PORT"
log_info "🔗 서브 서버 포트: $SUB_PORT"

# 메인 서버 시작
log_info "📡 메인 서버 시작 중..."
cd backend
PORT=$PORT npm run dev &
MAIN_PID=$!
cd ..

# 서브 서버 시작 (필요한 경우)
if [ -d "sub-server" ]; then
    log_info "📡 서브 서버 시작 중..."
    cd sub-server
    PORT=$SUB_PORT npm run dev &
    SUB_PID=$!
    cd ..
else
    log_warn "sub-server 디렉토리가 없습니다. 서브 서버를 건너뜁니다."
    SUB_PID=""
fi

# 서버 시작 대기
sleep 3

# 서버 상태 확인
if kill -0 $MAIN_PID 2>/dev/null; then
    log_info "✅ 메인 서버가 성공적으로 시작되었습니다. (PID: $MAIN_PID)"
    log_info "🌐 메인 서버 URL: http://localhost:$PORT"
    log_info "📚 Swagger UI: http://localhost:$PORT/api-docs"
    log_info "🔍 API 헬스체크: http://localhost:$PORT/api/health"
else
    log_error "❌ 메인 서버 시작에 실패했습니다."
    exit 1
fi

if [ ! -z "$SUB_PID" ] && kill -0 $SUB_PID 2>/dev/null; then
    log_info "✅ 서브 서버가 성공적으로 시작되었습니다. (PID: $SUB_PID)"
    log_info "🌐 서브 서버 URL: http://localhost:$SUB_PORT"
else
    log_warn "⚠️ 서브 서버 시작에 실패했습니다."
fi

log_info "📊 서버 모니터링 중... (Ctrl+C로 종료)"
log_info "💡 사용법:"
log_info "   일반 실행: ./start-servers.sh"
log_info "   DB 초기화: INIT_DB=true ./start-servers.sh"
log_info "   DB 재설정: RESET_DB=true ./start-servers.sh"

# 서버 상태 모니터링
while true; do
    if ! kill -0 $MAIN_PID 2>/dev/null; then
        log_error "❌ 메인 서버가 예기치 않게 종료되었습니다."
        break
    fi
    
    if [ ! -z "$SUB_PID" ] && ! kill -0 $SUB_PID 2>/dev/null; then
        log_warn "⚠️ 서브 서버가 예기치 않게 종료되었습니다."
    fi
    
    sleep 10
done

cleanup 