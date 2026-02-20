# This Story

5 minutes of daily reflection, powered by AI. Track your growth, discover your patterns.

## Quick Start

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

## Features

- Voice-first AI chat (음성 입력/출력 기본)
- OpenAI / Ollama 로컬 LLM 선택
- Automatic insight extraction (goals, concerns, actions, habits)
- Dashboard (streak, activity chart, habit tracker)
- Conversation history
- Web Push notifications (per-user scheduling, timezone)
- i18n (한국어, English)

## Scripts

```bash
npm run dev            # Dev server
npm run build          # Production build
npm run db:up          # Start PostgreSQL
npm run db:down        # Stop PostgreSQL
npm run db:migrate     # Run migrations
npm run db:seed        # Seed database
npm run db:studio      # Prisma Studio
```

## Docs

- [배포 가이드](docs/deployment.md) — Vercel + Neon 배포
- [크론잡 설정](docs/cron-setup.md) — 외부 크론으로 분 단위 알림
- [아키텍처](docs/architecture.md) — 시스템 구성, 디렉토리 구조, 데이터 모델
- [API 레퍼런스](docs/api.md) — 전체 API 엔드포인트
