# This Story

5 minutes of daily reflection, powered by AI. Track your growth, discover your patterns.

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- OpenAI API key

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env

# 3. Add your OpenAI API key to .env
# OPENAI_API_KEY="sk-..."

# 4. Start PostgreSQL
docker compose up -d

# 5. Run database migration and seed
npx prisma migrate deploy
npx prisma db seed

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Account

After seeding, you can log in with:
- Email: `demo@thistory.app`
- Password: `demo1234`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: NextAuth.js v5 (JWT + Credentials)
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Vercel AI SDK + OpenAI (gpt-4o-mini)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts

## Project Structure

```
src/
  app/
    (auth)/          Login, signup pages
    (main)/          Authenticated pages (chat, dashboard)
    api/             API routes (auth, chat, conversations, insights, streaks)
  components/
    ui/              Reusable components (Button, Input, Card, Badge, etc.)
    chat/            Chat-specific components
    dashboard/       Dashboard-specific components
  lib/
    auth.ts          NextAuth configuration
    prisma.ts        Database client
    streak.ts        Streak calculation
    ai/              AI prompts and extraction logic
  types/             TypeScript type definitions
prisma/
  schema.prisma      Database schema
  seed.ts            Seed data
```

## NPM Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:up        # Start PostgreSQL
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Features (MVP)

- JWT-based authentication (signup/login)
- Streaming AI chat with guided daily reflection
- Automatic insight extraction (goals, concerns, actions, habits)
- Dashboard with streak tracking, activity chart, habit tracker
- Conversation history viewer
