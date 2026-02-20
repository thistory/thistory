# Deployment Guide

Vercel (호스팅) + Neon (PostgreSQL) 조합으로 **월 $0**에 배포하는 가이드.

## 아키텍처

```
[사용자] → [Vercel - Next.js App] → [Neon - PostgreSQL]
                                  → [OpenAI API]
```

## 1단계: Neon 데이터베이스 생성

1. [neon.tech](https://neon.tech) 가입 (GitHub 로그인 가능)
2. **New Project** 클릭
3. 설정:
   - Project name: `thistory`
   - Region: `Asia Pacific (Singapore)` (한국에서 가장 가까운 리전)
   - Compute size: Free tier (0.25 vCPU)
4. 생성 완료 후 **Connection string** 복사 (형식: `postgresql://USER:PASS@HOST/thistory?sslmode=require`)

### 마이그레이션 실행

로컬에서 Neon DB에 마이그레이션을 적용합니다:

```bash
# 복사한 Neon connection string을 사용
DATABASE_URL="postgresql://USER:PASS@HOST/thistory?sslmode=require" npx prisma migrate deploy
```

### (선택) 시드 데이터

데모 계정을 생성하려면:

```bash
DATABASE_URL="postgresql://USER:PASS@HOST/thistory?sslmode=require" npx prisma db seed
```

> 시드를 실행하면 `demo@thistory.app` / `demo1234` 데모 계정이 생성됩니다.

## 2단계: 시크릿 키 생성

로컬에서 아래 명령어를 실행하여 필요한 시크릿을 준비합니다:

```bash
# AUTH_SECRET (NextAuth.js 세션 암호화)
openssl rand -base64 32

# CRON_SECRET (cron 엔드포인트 인증)
openssl rand -base64 32

# VAPID 키 (Web Push 알림)
npx web-push generate-vapid-keys
```

생성된 값을 메모장에 복사해 둡니다.

## 3단계: GitHub 리포지토리

Vercel은 GitHub 리포에서 자동 배포합니다.

```bash
# 이미 git 리포가 있다면 GitHub에 push
git remote add origin https://github.com/YOUR_USERNAME/thistory.git
git push -u origin main
```

## 4단계: Vercel 배포

1. [vercel.com](https://vercel.com) 가입 (GitHub 로그인)
2. **Add New... → Project**
3. GitHub 리포지토리 `thistory` 선택 → **Import**
4. **Environment Variables** 섹션에 아래 값 입력:

| Variable | Value | 설명 |
|----------|-------|------|
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Neon connection string |
| `AUTH_SECRET` | (생성한 값) | NextAuth 시크릿 |
| `AUTH_TRUST_HOST` | `true` | Vercel 환경 필수 |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API 키 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (생성한 값) | Push 알림 공개 키 |
| `VAPID_PRIVATE_KEY` | (생성한 값) | Push 알림 비밀 키 |
| `CRON_SECRET` | (생성한 값) | Cron 인증 |
| `LOG_LEVEL` | `warn` | 프로덕션 로그 레벨 |

5. **Deploy** 클릭
6. 배포 완료 후 `https://thistory-xxx.vercel.app` 주소로 접속 확인

## 5단계: 배포 확인

1. 할당된 URL로 접속
2. 회원가입 또는 시드 데이터 생성 후 데모 계정으로 로그인
3. 채팅 테스트 (AI 응답 확인)
4. 대시보드, 설정 페이지 동작 확인

## Push 알림 (Cron)

`vercel.json`에 매 시간 cron이 설정되어 있습니다:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 * * * *"
    }
  ]
}
```

**주의**: Vercel Hobby(무료) 플랜은 **일 1회** cron만 지원합니다.

### 무료로 시간별 알림 보내기

Vercel 무료 플랜에서도 시간별 알림을 보내려면 외부 cron 서비스를 사용합니다:

1. [cron-job.org](https://cron-job.org) 가입 (무료)
2. **Create Cronjob** 클릭
3. 설정:
   - URL: `https://YOUR_APP.vercel.app/api/cron/notifications`
   - Schedule: Every 1 hour
   - HTTP Method: GET
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
4. **Create** 클릭

이렇게 하면 Vercel cron 대신 외부에서 매시간 호출합니다.

## 커스텀 도메인 (선택)

1. 도메인 구입 (Namecheap, Cloudflare 등 — 연 $10~15)
2. Vercel 프로젝트 → **Settings → Domains**
3. 도메인 입력 후 DNS 레코드 설정 안내에 따라 설정
4. SSL 인증서는 Vercel이 자동 발급

## 비용 요약

| 항목 | 비용 |
|------|------|
| Vercel Hobby | $0 |
| Neon Free | $0 |
| OpenAI API (gpt-4o-mini) | ~$0.01/월 (1인 기준) |
| Web Push (VAPID) | $0 |
| 도메인 (선택) | ~$10~15/년 |
| **합계** | **~$0/월** |

## 보안

### 환경변수 분류

| 변수 | 노출 시 위험 | Git 커밋 | 어디에 설정? | 비고 |
|------|:---:|:---:|------|------|
| `DATABASE_URL` | **치명** | X | Vercel Env / `.env.local` | DB 전체 접근 가능 |
| `AUTH_SECRET` | **치명** | X | Vercel Env / `.env.local` | 세션 위조 가능 |
| `OPENAI_API_KEY` | **치명** | X | Vercel Env / `.env.local` | 과금 발생 |
| `VAPID_PRIVATE_KEY` | 높음 | X | Vercel Env / `.env.local` | 임의 푸시 발송 가능 |
| `CRON_SECRET` | 중간 | X | Vercel Env / `.env.local` | cron 엔드포인트 무단 호출 |
| `AUTH_TRUST_HOST` | 없음 | O | `.env.production` | 설정값일 뿐 |
| `LOG_LEVEL` | 없음 | O | `.env.production` | 설정값일 뿐 |
| `NEXTAUTH_URL` | 없음 | O | `.env.production` | 공개 도메인 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 없음 | O | `.env.development` | 공개키 (브라우저에 노출되는 것이 정상) |

### 파일별 역할

| 파일 | Git | 역할 | 실제 시크릿 |
|------|:---:|------|:---:|
| `.env.development` | O | 개발 기본값 (localhost DB, dev 플레이스홀더) | X |
| `.env.production` | O | 프로덕션 템플릿 (값 비어 있음) | X |
| `.env.example` | O | 변수 목록 + 설명 | X |
| `.env.local` | **X** | 로컬 시크릿 오버라이드 | O |
| `.env` | **X** | 로컬 개발용 전체 값 | O |
| Vercel Env Vars | - | 프로덕션 시크릿 | O |

> Vercel에 설정한 환경 변수는 `.env.production`보다 우선합니다.

### 규칙

1. **실제 키는 절대 커밋하지 않는다** — `.env.local` 또는 Vercel 환경변수만 사용
2. **`.env.development`에는 플레이스홀더만** — `dev-secret-...` 형태, 실제 값 금지
3. **프로덕션 VAPID 키는 별도 생성** — `.env.development`의 dev 키를 프로덕션에 재사용하지 않는다
4. **GitHub에 push 전** `.env`, `.env.local`이 `.gitignore`에 포함되어 있는지 확인

## 트러블슈팅

### DB 연결 오류
- Neon connection string에 `?sslmode=require`가 포함되어 있는지 확인
- Neon 대시보드에서 IP 제한이 없는지 확인

### 빌드 실패
- `prisma generate`가 `postinstall`에 포함되어 있음 (package.json)
- Vercel 빌드 로그에서 에러 메시지 확인

### Push 알림 안 옴
- VAPID 키가 환경 변수에 올바르게 설정되었는지 확인
- CRON_SECRET이 cron 서비스와 Vercel 환경 변수에서 동일한지 확인
- 브라우저에서 알림 권한을 허용했는지 확인

### Cold Start 느림
- Neon Free tier는 5분 비활성 시 슬립 → 첫 요청에 ~2초 소요
- 정상 동작이며, 이후 요청은 빠름
