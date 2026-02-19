# This Story

5 minutes of daily reflection, powered by AI. Track your growth, discover your patterns.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
npm install
npm run db:up
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — Demo: `demo@thistory.app` / `demo1234`

### AI Provider

OpenAI 또는 Ollama(로컬 LLM) 중 선택. Settings 페이지에서 전환.

**OpenAI** — `.env.local` 생성 후 API 키 추가:
```bash
OPENAI_API_KEY="sk-..."
```

**Ollama (로컬, 무료)**:
```bash
brew install ollama
brew services start ollama
ollama pull llama3.2
```
Settings에서 Ollama 선택 → 모델 `llama3.2` → 연결 테스트 확인.

> Mac(Apple Silicon)에서는 brew 설치가 Metal GPU 가속을 사용하므로 Docker보다 빠릅니다.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Auth**: NextAuth.js v5 (JWT + Credentials)
- **Database**: PostgreSQL + Prisma 7
- **AI**: AI SDK v6 + OpenAI / Ollama
- **Voice**: Web Speech API (STT + TTS)
- **Push**: Web Push API + web-push
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts

## Scripts

```bash
npm run dev            # Dev server
npm run build          # Production build
npm run start          # Production server
npm run db:up          # Start PostgreSQL
npm run db:down        # Stop PostgreSQL
npm run db:up:prod     # Start prod PostgreSQL
npm run db:down:prod   # Stop prod PostgreSQL
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run db:studio      # Prisma Studio
```

## Environments

| Priority | File | Loaded When | Git |
|----------|------|-------------|-----|
| 1 | `.env.local` | Always | No |
| 2 | `.env.development` | `next dev` | Yes |
| 2 | `.env.production` | `next build/start` | Yes |

`.env.local`(gitignored)로 API 키 등 민감 값 오버라이드.

## Push Notifications

```bash
npm run generate-vapid-keys
```

생성된 키를 `.env.local`에 추가 후 Settings에서 알림 활성화. 로컬 테스트:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notifications
```

## Features

- Voice-first AI chat (음성 입력/출력 기본)
- OpenAI / Ollama 로컬 LLM 선택
- Automatic insight extraction (goals, concerns, actions, habits)
- Dashboard (streak, activity chart, habit tracker)
- Conversation history
- Web Push notifications (per-user scheduling, timezone)
- i18n (한국어, English)
