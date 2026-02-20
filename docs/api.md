# API 레퍼런스

모든 API는 Next.js Route Handler로 구현되어 있으며, 별도 서버 없이 Vercel 서버리스 함수로 실행됩니다.

## 인증

NextAuth.js JWT 기반. 인증이 필요한 엔드포인트는 세션 쿠키로 자동 인증됩니다.
크론 엔드포인트는 `Authorization: Bearer <CRON_SECRET>` 헤더로 인증합니다.

---

## 채팅

### `POST /api/chat`

AI 대화 스트리밍. UI Message Stream 형식으로 응답합니다.

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "오늘 하루 좋았어요" }
  ],
  "conversationId": "clxxx...",
  "locale": "ko"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `messages` | array | O | AI SDK UIMessage 형식 |
| `conversationId` | string | X | 기존 대화 ID (없으면 새 대화 생성) |
| `locale` | string | X | 언어 (`ko`, `en`) |

**Response:** Streaming (UI Message Stream)
**Response Header:** `X-Conversation-Id` — 대화 ID

---

## 대화 목록

### `GET /api/conversations`

유저의 대화 목록 조회.

**Response:**

```json
[
  {
    "id": "clxxx...",
    "title": "업무 스트레스와 운동 계획",
    "summary": "업무 스트레스와 운동 계획에 대한 성찰",
    "createdAt": "2026-02-20T12:00:00Z",
    "_count": { "messages": 8 }
  }
]
```

---

## 인사이트

### `GET /api/insights`

유저의 인사이트 목록 조회.

**Query Params:**

| 파라미터 | 설명 |
|---|---|
| `type` | 필터: `GOAL`, `CONCERN`, `ACTION`, `HABIT` |

**Response:**

```json
[
  {
    "id": "clxxx...",
    "type": "GOAL",
    "content": "매일 30분 운동하기",
    "tags": ["health", "productivity"],
    "createdAt": "2026-02-20T12:00:00Z"
  }
]
```

---

## 연속 기록

### `GET /api/streaks`

유저의 streak 정보.

**Response:**

```json
{
  "currentStreak": 5,
  "longestStreak": 12,
  "lastConversationDate": "2026-02-20T00:00:00Z"
}
```

---

## AI 설정

### `GET /api/ai/preferences`

현재 AI 모델 설정 조회.

### `PUT /api/ai/preferences`

AI 모델 설정 변경.

**Request Body:**

```json
{
  "aiProvider": "openai",
  "aiModel": "gpt-4.1-mini",
  "ollamaUrl": "http://localhost:11434"
}
```

---

## 언어 설정

### `PUT /api/locale`

유저 언어 설정 변경 (DB 저장).

**Request Body:**

```json
{
  "locale": "ko"
}
```

---

## 알림

### `GET /api/notifications/preferences`

알림 설정 조회.

### `PUT /api/notifications/preferences`

알림 설정 변경.

**Request Body:**

```json
{
  "notificationEnabled": true,
  "notificationTime": "21:30",
  "timezone": "Asia/Seoul"
}
```

### `POST /api/notifications/test`

테스트 푸시 알림 발송. 유저의 locale에 맞는 언어로 전송됩니다.

**Response:**

```json
{
  "sent": 1,
  "failed": 0
}
```

---

## 푸시 구독

### `POST /api/push/subscribe`

푸시 구독 등록.

**Request Body:**

```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### `DELETE /api/push/subscribe`

푸시 구독 해제.

**Request Body:**

```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

---

## 크론

### `GET /api/cron/notifications`

알림 체크 및 발송. 외부 크론 서비스에서 매분 호출합니다.

**인증:** `Authorization: Bearer <CRON_SECRET>`

**Response:**

```json
{
  "sent": 3,
  "failed": 0,
  "checked": 15
}
```

설정 가이드: [docs/cron-setup.md](./cron-setup.md)
