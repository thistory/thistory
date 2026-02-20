# 아키텍처

## 시스템 구성

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Hobby)                    │
│                                                     │
│  Next.js 16 (App Router)                            │
│  ├── 프론트엔드 (React 19 + Tailwind CSS v4)        │
│  ├── API Routes (서버리스 함수)                      │
│  └── Middleware (NextAuth 인증)                      │
│                                                     │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
       ▼              ▼              ▼
   [Neon DB]     [OpenAI API]   [Web Push]
   PostgreSQL    gpt-4.1-mini    VAPID
                 gpt-4o-mini
                 gpt-4.1-nano

       ▲
       │ 매분 GET
  [cron-job.org]
```

## 기술 스택

| 레이어 | 기술 | 역할 |
|---|---|---|
| Framework | Next.js 16 (App Router) | 프론트엔드 + API 서버 (서버리스) |
| Auth | NextAuth.js v5 | JWT + Credentials 인증 |
| Database | PostgreSQL (Neon) + Prisma 7 | 데이터 저장 + ORM |
| AI (대화) | AI SDK v6 + gpt-4.1-mini | 메인 채팅 |
| AI (추출) | AI SDK v6 + gpt-4o-mini | 인사이트 추출 (구조화 출력) |
| AI (요약) | AI SDK v6 + gpt-4.1-nano | 대화 요약 |
| Voice | Web Speech API | STT (음성→텍스트), TTS (텍스트→음성) |
| Push | Web Push API + web-push | 푸시 알림 |
| Cron | cron-job.org (외부) | 매분 알림 체크 호출 |
| Styling | Tailwind CSS v4 | UI 스타일링 |
| Charts | Recharts | 대시보드 차트 |
| i18n | next-intl | 한국어/영어 다국어 |

## 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/              # 인증 페이지 (login, signup)
│   ├── (main)/              # 인증 필요 페이지
│   │   ├── chat/            # AI 대화
│   │   ├── dashboard/       # 대시보드
│   │   └── settings/        # 설정
│   └── api/
│       ├── auth/            # NextAuth 엔드포인트
│       ├── chat/            # AI 대화 스트리밍
│       ├── cron/            # 크론잡 (알림 발송)
│       ├── locale/          # 유저 언어 설정
│       ├── ai/              # AI 모델 설정
│       ├── notifications/   # 알림 설정 + 테스트
│       ├── push/            # 푸시 구독
│       ├── conversations/   # 대화 목록
│       ├── insights/        # 인사이트 조회
│       └── streaks/         # 연속 기록
├── components/
│   ├── chat/                # 채팅 UI
│   ├── dashboard/           # 대시보드 위젯
│   └── settings/            # 설정 UI
├── hooks/                   # 커스텀 훅 (음성 입출력)
├── lib/
│   ├── ai/                  # AI 모듈 (provider, prompts, extract)
│   ├── auth.ts              # NextAuth 설정
│   ├── notifications.ts     # 알림 발송 로직
│   ├── push.ts              # 서버 사이드 푸시
│   ├── push-client.ts       # 클라이언트 사이드 푸시
│   └── prisma.ts            # Prisma 클라이언트
├── i18n/                    # 다국어 설정
└── middleware.ts             # 인증 미들웨어
```

## AI 모델 라우팅

태스크별로 최적 모델을 자동 분기합니다:

```
유저 메시지 → chat/route.ts
                │
                ├─ streamText()       → gpt-4.1-mini (대화 품질 최우선)
                │   temperature: 0.7
                │   frequencyPenalty: 0.3
                │
                └─ onFinish (대화 종료 감지 시)
                    ├─ extractInsights() → gpt-4o-mini (구조화 출력)
                    │   temperature: 0.1
                    └─ summary           → gpt-4.1-nano (단순 요약)
                        temperature: 0.3
```

## 데이터 모델

```
User ─┬─ Conversation ─┬─ Message
      │                 └─ Insight
      ├─ Streak
      └─ PushSubscription
```

| 모델 | 설명 |
|---|---|
| User | 유저 (인증, 설정, locale, AI 모델 선택) |
| Conversation | 대화 세션 (제목, 요약) |
| Message | 개별 메시지 (USER / ASSISTANT) |
| Insight | 추출된 인사이트 (GOAL, CONCERN, ACTION, HABIT) |
| Streak | 연속 기록 |
| PushSubscription | 푸시 구독 정보 |

## 인증 흐름

```
[로그인 폼] → POST /api/auth/callback/credentials
                → bcrypt 비밀번호 검증
                → JWT 토큰 발급 (30일 유효)
                → 세션 쿠키 설정

[인증 필요 페이지] → middleware.ts
                     → JWT 검증
                     → 실패 시 /login 리다이렉트
```

## 알림 흐름

```
[Settings] → 알림 ON → 브라우저 푸시 권한 요청
                     → Service Worker 등록
                     → PushSubscription 서버 저장
                     → notificationTime + timezone 저장

[cron-job.org] → 매분 → GET /api/cron/notifications
                        → 유저별 로컬 시간 계산
                        → 설정 시간 매칭 → 푸시 발송
                        → 유저 locale에 맞는 언어로 전송
```
