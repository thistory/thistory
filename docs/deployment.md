# 배포 가이드

Vercel (호스팅) + Neon (PostgreSQL) 조합으로 **월 $0**에 배포하는 가이드.

## 아키텍처

```
[사용자] → [Vercel - Next.js App] → [Neon - PostgreSQL]
                                  → [OpenAI API]
         ← [cron-job.org] ─매분──→ [/api/cron/notifications]
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
DATABASE_URL="postgresql://USER:PASS@HOST/thistory?sslmode=require" npx prisma migrate deploy
```

### (선택) 시드 데이터

데모 계정을 생성하려면:

```bash
DATABASE_URL="postgresql://USER:PASS@HOST/thistory?sslmode=require" npx prisma db seed
```

> 시드를 실행하면 `demo@thistory.app` / `demo1234` 데모 계정이 생성됩니다.

## 2단계: 시크릿 키 생성

```bash
# AUTH_SECRET (NextAuth.js 세션 암호화)
openssl rand -base64 32

# CRON_SECRET (cron 엔드포인트 인증)
openssl rand -base64 32

# VAPID 키 (Web Push 알림)
npx web-push generate-vapid-keys
```

## 3단계: GitHub 리포지토리

```bash
git remote add origin https://github.com/YOUR_USERNAME/thistory.git
git push -u origin main
```

## 4단계: Vercel 배포

1. [vercel.com](https://vercel.com) 가입 (GitHub 로그인)
2. **Add New... → Project**
3. GitHub 리포지토리 `thistory` 선택 → **Import**
4. **Environment Variables** 설정:

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

## 5단계: 크론잡 설정

배포 후 알림 발송을 위해 외부 크론을 설정합니다.

→ **[docs/cron-setup.md](./cron-setup.md)** 참고

## 6단계: 배포 확인

1. 할당된 URL로 접속
2. 회원가입 또는 데모 계정으로 로그인
3. 채팅 테스트 (AI 응답 확인)
4. Settings에서 알림 설정 → 테스트 알림 발송

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
| OpenAI API (gpt-4.1-mini) | ~$0.005/세션 |
| cron-job.org | $0 |
| Web Push (VAPID) | $0 |
| 도메인 (선택) | ~$10~15/년 |

## 보안

### 환경변수 분류

| 변수 | 노출 시 위험 | Git 커밋 | 어디에 설정? |
|------|:---:|:---:|------|
| `DATABASE_URL` | **치명** | X | Vercel Env / `.env.local` |
| `AUTH_SECRET` | **치명** | X | Vercel Env / `.env.local` |
| `OPENAI_API_KEY` | **치명** | X | Vercel Env / `.env.local` |
| `VAPID_PRIVATE_KEY` | 높음 | X | Vercel Env / `.env.local` |
| `CRON_SECRET` | 중간 | X | Vercel Env / `.env.local` |
| `AUTH_TRUST_HOST` | 없음 | O | `.env.production` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 없음 | O | `.env.development` |

### 규칙

1. **실제 키는 절대 커밋하지 않는다** — `.env.local` 또는 Vercel 환경변수만 사용
2. **`.env.development`에는 플레이스홀더만** — 실제 값 금지
3. **프로덕션 VAPID 키는 별도 생성** — 개발용 키를 재사용하지 않는다
4. **push 전** `.env`, `.env.local`이 `.gitignore`에 포함되어 있는지 확인

## 트러블슈팅

### DB 연결 오류
- Neon connection string에 `?sslmode=require` 포함 확인
- Neon 대시보드에서 IP 제한 확인

### 빌드 실패
- `prisma generate`가 `postinstall`에 포함되어 있음 (package.json)
- Vercel 빌드 로그에서 에러 메시지 확인

### Push 알림 안 옴
- → [docs/cron-setup.md 트러블슈팅](./cron-setup.md#트러블슈팅) 참고

### Cold Start 느림
- Neon Free tier는 5분 비활성 시 슬립 → 첫 요청에 ~2초 소요
- 정상 동작이며, 이후 요청은 빠름
