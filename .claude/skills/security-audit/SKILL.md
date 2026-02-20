---
name: security-audit
description: 배포 전 보안검사. API 라우트, 인증, 입력 검증, 보안 헤더, 환경변수, SSRF, IDOR 등 OWASP Top 10 기준 전수검사.
user-invocable: true
---

# 배포 전 보안검사 (Pre-Deployment Security Audit)

This Story 앱의 배포 전 보안검사를 수행한다.
**모든 API 라우트, 인증/인가, 입력 검증, 보안 헤더, 환경변수, 의존성을 전수검사한다.**

## 검사 수행 방법

아래 체크리스트를 **순서대로** 실행한다. 각 항목에 대해:
- 관련 코드를 직접 읽고 분석
- 문제 발견 시 **심각도** (Critical/High/Medium/Low/Info), **파일:라인**, **문제 설명**, **수정 방안**을 표로 정리
- 문제가 없으면 PASS로 표시

결과는 아래 형식으로 출력한다:

```
## 보안검사 결과 요약

| # | 검사 항목 | 결과 | 심각도 | 비고 |
|---|----------|------|--------|------|
| 1 | 인증/인가 | FAIL | High   | IDOR 발견 |
| 2 | 입력 검증 | PASS | -      | - |
...

## 상세 발견사항

### [Critical] SSRF via ollamaUrl
- **파일**: src/lib/ai/provider.ts:28
- **문제**: ...
- **수정 방안**: ...
```

---

## 1. 인증 (Authentication)

### 1.1 세션/JWT 설정
- `src/lib/auth.config.ts` — JWT maxAge, strategy 확인
- AUTH_SECRET이 충분히 강한지 (최소 32자, 무작위)
- 세션 고정 공격(session fixation) 가능 여부

### 1.2 비밀번호 정책
- `src/app/api/auth/signup/route.ts` — 비밀번호 길이, 복잡성 규칙
- bcrypt salt rounds 확인 (최소 12)
- 비밀번호 변경/재설정 엔드포인트 존재 여부

### 1.3 Brute Force 방어
- 로그인 실패 시 계정 잠금 또는 지연 메커니즘
- Rate limiting 설정 여부

### 1.4 인증 우회
- 모든 API 라우트에서 `auth()` 호출 확인
- middleware matcher가 모든 보호 경로를 포함하는지

---

## 2. 인가 (Authorization) — IDOR 검사

### 2.1 리소스 소유권 검증
**모든 API 라우트에서 리소스 접근 시 userId 필터가 적용되는지 검사:**

```
검사 대상:
- POST /api/chat — conversationId 제공 시 소유권 확인 여부
- GET /api/conversations — userId 필터 여부
- GET /api/insights — userId 필터 여부
- GET /api/streaks — userId 필터 여부
- PUT /api/ai/preferences — 자기 자신만 수정 가능한지
- PUT /api/notifications/preferences — 자기 자신만 수정 가능한지
- PUT /api/locale — 자기 자신만 수정 가능한지
- POST /api/push/subscribe — 다른 사용자 구독 탈취 여부
- DELETE /api/push/subscribe — 다른 사용자 구독 삭제 가능 여부
```

핵심 패턴: `prisma.xxx.findMany({ where: { userId: session.user.id } })` 형태인지 확인.
`conversationId`만으로 조회하고 userId 필터가 없으면 **IDOR 취약점**.

---

## 3. 입력 검증 (Input Validation)

### 3.1 Zod 스키마 검사
모든 API 라우트의 요청 본문에 Zod 검증이 적용되는지:

```
검사 대상:
- POST /api/auth/signup — signupSchema
- POST /api/chat — chatSchema
- PUT /api/ai/preferences — aiPreferencesSchema
- PUT /api/notifications/preferences — preferencesSchema
- PUT /api/locale — localeSchema
- POST /api/push/subscribe — subscribeSchema
- DELETE /api/push/subscribe — endpoint 검증
```

### 3.2 쿼리 파라미터 검증
- GET 요청의 searchParams가 검증되는지 (limit, offset, type 등)
- 타입 캐스팅 오류 가능성

### 3.3 SQL Injection
- Prisma ORM 사용 시 raw query 여부 확인
- `$queryRaw`, `$executeRaw` 사용 검색

### 3.4 XSS (Cross-Site Scripting)
- 사용자 입력이 HTML로 렌더링되는 곳 확인
- React의 기본 이스케이프를 우회하는 raw HTML 삽입 패턴 사용 여부 검색
  - `Grep`으로 `dangerouslySet` 패턴 검색

---

## 4. SSRF (Server-Side Request Forgery)

### 4.1 ollamaUrl 검사
`src/lib/ai/provider.ts` — 사용자가 설정한 `ollamaUrl`이 서버에서 HTTP 요청에 사용됨:

```typescript
const baseURL = `${ollamaUrl || "http://localhost:11434"}/v1`;
const ollama = createOpenAI({ baseURL, apiKey: "ollama" });
```

**검사 항목:**
- 내부 네트워크 접근 차단 여부 (169.254.x.x, 10.x.x.x, 192.168.x.x, 127.0.0.1 등)
- 허용 URL 화이트리스트 존재 여부
- file://, gopher:// 등 위험한 프로토콜 차단 여부

### 4.2 기타 외부 요청
- 사용자 입력 기반으로 서버가 외부 URL에 요청하는 코드 전수검사

---

## 5. 보안 헤더 (Security Headers)

### 5.1 next.config.ts 헤더 검사
```
필수 헤더 체크리스트:
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Strict-Transport-Security (HSTS)
- [ ] Permissions-Policy
- [ ] Content-Security-Policy
```

### 5.2 CSP 세부 검사
- script-src에 unsafe 지시자가 포함되어 있는지 확인
- 와일드카드(*) 사용 여부
- connect-src에 필요한 도메인만 포함되는지

### 5.3 Permissions-Policy와 실제 기능 충돌
- `microphone=()` 설정 시 Web Speech API 음성 입력 차단 여부 확인
- 실제 사용하는 브라우저 API와 정책 일치 여부

---

## 6. 환경변수 & 시크릿 관리

### 6.1 Git에 커밋된 시크릿
```bash
# 실행할 검사:
git log --all -p -- '*.env*' '*.key' '*.pem'
# .env.development에 실제 시크릿이 포함되어 있는지
# VAPID 키, AUTH_SECRET 등이 하드코딩되어 있는지
```

### 6.2 .gitignore 검사
- `.env`, `.env.local` 이 gitignore에 포함되는지
- `*.pem`, SSH 키 등 민감 파일 패턴

### 6.3 프로덕션 환경변수 체크리스트
```
필수 환경변수:
- AUTH_SECRET — 최소 32자 무작위 값 (openssl rand -base64 32)
- DATABASE_URL — SSL 연결 (sslmode=require)
- CRON_SECRET — 무작위 값
- OPENAI_API_KEY — 설정됨
- VAPID keys — 프로덕션 전용 키
- NEXTAUTH_URL — 실제 도메인
```

### 6.4 클라이언트 노출 환경변수
- `NEXT_PUBLIC_*` 접두사 변수 중 민감 정보 포함 여부
- 클라이언트 번들에 서버 시크릿이 포함되는지

---

## 7. Rate Limiting & DoS 방어

### 7.1 비용 발생 엔드포인트
```
비용/리소스 집약 엔드포인트:
- POST /api/chat — OpenAI API 호출 (과금)
- POST /api/insights — AI 추출 (과금)
- POST /api/notifications/test — Push 알림 발송
- POST /api/auth/signup — DB 쓰기 + bcrypt 연산
```

### 7.2 Rate Limiting 구현 여부
- Vercel Edge Middleware 또는 API 라우트 레벨 rate limiting
- IP 기반 또는 사용자 기반 제한
- 미구현 시 권장 솔루션 제안

---

## 8. API 보안

### 8.1 Cron 엔드포인트 보호
- `/api/cron/notifications` — Bearer token 인증 검사
- 타이밍 공격 방어 (constant-time comparison)

### 8.2 에러 처리
- 에러 응답에 스택 트레이스나 내부 정보가 노출되는지
- Prisma 에러 메시지가 직접 클라이언트에 전달되는지

### 8.3 HTTP 메서드 제한
- 각 라우트에서 허용된 HTTP 메서드만 처리하는지
- 미정의 메서드(OPTIONS, PATCH 등)에 대한 405 응답

---

## 9. 의존성 보안

### 9.1 알려진 취약점
```bash
# 실행:
npm audit
# 또는
npx audit-ci --moderate
```

### 9.2 주요 패키지 버전 확인
- next, next-auth, prisma, bcryptjs, web-push 등 최신 보안 패치 적용 여부
- `package-lock.json` 또는 lock 파일 존재 확인

---

## 10. 데이터 보호

### 10.1 민감 데이터 로깅
- `console.log`, `console.error`에 사용자 데이터(이메일, 비밀번호, 메시지 내용)가 포함되는지
- `logger.*` 호출에서 민감 정보 마스킹 여부

### 10.2 응답에 불필요한 데이터 포함
- API 응답에 `passwordHash` 등 민감 필드 포함 여부
- Prisma `select`로 필요한 필드만 반환하는지

### 10.3 Cascade Delete 설정
- 사용자 삭제 시 모든 관련 데이터(대화, 메시지, 인사이트, 구독) 삭제 확인

---

## 11. AI 보안 (Prompt Injection)

### 11.1 프롬프트 주입 방어
- 사용자 입력이 시스템 프롬프트에 직접 삽입되는지
- 사용자 이름(`userName`)이 시스템 프롬프트에 포함 — 주입 경로 여부
- 이전 인사이트가 시스템 프롬프트에 포함 — 저장된 주입(stored prompt injection) 가능성

### 11.2 AI 응답 필터링
- AI 응답이 필터링 없이 사용자에게 전달되는지
- 의료/법률 조언 등 위험 응답 감지

---

## 12. 배포 설정 (Vercel/인프라)

### 12.1 vercel.json 검사
- cron 설정의 적절성
- 불필요한 라우트 노출 여부

### 12.2 Docker 설정 (해당 시)
- 프로덕션 Docker 이미지에 dev 의존성 포함 여부
- 비루트 사용자 실행 여부

### 12.3 데이터베이스 연결
- SSL 연결 강제 여부
- 연결 풀링 설정

---

## 결과 보고 형식

검사 완료 후 아래 형식으로 최종 보고서를 출력한다:

```markdown
# 보안검사 결과 보고서
**검사일**: YYYY-MM-DD
**대상**: This Story (thistory)
**검사자**: Claude Security Audit

## 요약
- Critical: N건
- High: N건
- Medium: N건
- Low: N건
- Info: N건
- PASS: N건

## 발견사항 상세

### [심각도] 제목
- **위치**: 파일:라인
- **설명**: 무엇이 문제인지
- **영향**: 악용 시 어떤 피해가 발생하는지
- **재현**: 공격 시나리오 (가능한 경우)
- **수정 방안**: 구체적 코드 수정 제안
- **참고**: OWASP, CWE 번호 등

## 권장 조치 우선순위
1. [Critical] 즉시 수정 필요
2. [High] 배포 전 수정 권장
3. [Medium] 조기 수정 권장
4. [Low] 개선 권장
```
