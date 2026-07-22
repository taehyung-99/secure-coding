# 📦 소규모 중고 거래 플랫폼(이것저것마켓)

이것저것을 쉽고 안전하게 거래하는 중고거래 플랫폼

## 주요 기능

- 회원가입, 로그인, 로그아웃, 프로필/비밀번호 수정
- 상품 등록, 목록/상세 조회, 수정/삭제, 상태 변경
- 상품명, 카테고리, 지역, 상태, 정렬 기준 검색
- 실시간 상품 채팅, 유저 간 1:1 채팅, 전체 채팅
- 모의 결제 기능
- 상품/사용자 신고, 차단, 신고 누적 자동 처리
- 사용자 문의 및 관리자 문의 관리
- 관리자 사용자/상품/신고/거래/조치 로그 관리

---
<br>

# 💁 환경 구축 가이드
```text
- 지원 실행 환경 : Windows(WSL2 Ubuntu 권장), macOS, Linux
- Database: Docker Desktop의 PostgreSQL 16 컨테이너
- Runtime: Node.js 22.23.1, pnpm 11.7.0
- Application: Next.js 15 + TypeScript + Prisma + Socket.IO
- 기본 접속 주소: `http://Your-Ip:3000`
```
Git 저장소에는 DB schema와 migration만 포함됩니다. 기존 PC의 회원, 상품, 채팅, 거래 데이터와 업로드 이미지는 새 PC로 복사되지 않으며, 새 PostgreSQL DB와 빈 `public/uploads` 디렉터리에서 시작합니다. 기본 카테고리는 migration으로 자동 생성됩니다.

## 준비 사항

다음 항목을 확인

1. Node.js v22.23.1 
 [(설치 방법)](https://nodejs.org/ko/download)
2. pnpm 11.7.0
```bash
npm install -g pnpm@11.7.0
```
3. Docker
4. 로컬 포트 `3000`(애플리케이션 서버), `5432`(DB 서버) 사용 가능 여부

---

## 환경 구축
### 1. 로컬 저장소에 프로젝트 저장
```bash
git clone https://github.com/taehyung-99/Secure-Coding.git
cd Secure-Coding
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
nano .env
```

아래의 최소 설정 진행

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/local_market_platform?schema=public"
SESSION_SECRET="32자-이상의-임의-문자열로-교체"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

안전한 `SESSION_SECRET` 후보를 아래 명령으로 생성

```bash
openssl rand -hex 32
```

세션 토큰과 CSRF 토큰 검증을 위한 서명 키 등록을 위해 출력된 값을 `.env`의 `SESSION_SECRET`에 입력

### 3. 의존성 설치 및 PostgreSQL DB 실행
```bash
pnpm install --frozen-lockfile
docker compose up -d
```

### 4. Prisma migration 적용

```bash
pnpm prisma:generate
pnpm prisma:migrate:deploy
```
이 과정에서 앱 테이블과 기본 카테고리가 생성

### 5. 서버 실행
```bash
pnpm build
pnpm start
```

아래 주소로 접속하여 플랫폼 사용
```text
http://localhost:3000
```

---


## 추가 설정(선택)

### 관리자 계정 생성

`.env`에 아래 값을 추가

```env
ADMIN_USERNAME="admin" # ID 
ADMIN_EMAIL="admin@example.com" # Email
ADMIN_PASSWORD="ChangeMe!12345" # PASSWORD 12자 이상이며 영문, 숫자, 특수문자를 포함해야 함
ADMIN_NICKNAME="관리자" # 비워놔도, default "관리자"
ADMIN_REGION="Seoul" # 비워놔도, default "Seoul"
```

`.env` 수정 후, 아래 명령을 통해 관리자 계정을 생성

```bash
pnpm prisma:seed
```

관리자 생성이 끝나면 `.env`에서 `ADMIN_*` 값을 제거하거나 비워두는 것을 권장.<br>일반 회원가입 API로는 관리자 권한을 만들 수 없습니다.