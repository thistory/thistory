# 크론잡 설정 가이드

유저별 커스텀 알림 시간(분 단위)을 지원하기 위해 **매분 실행되는 외부 크론**이 필요합니다.

## 왜 외부 크론인가?

- Vercel Hobby(무료) 플랜은 크론 최소 간격이 **1일 1회**
- 유저가 `21:30`, `08:15` 등 분 단위로 알림 시간을 설정할 수 있음
- 매분 크론이 호출되어야 해당 분에 맞는 유저에게 정확히 알림 발송 가능

### 동작 흐름

```
[cron-job.org] ──매분 GET──▶ /api/cron/notifications
                               │
                               ├─ CRON_SECRET 인증 확인
                               ├─ 알림 활성화된 유저 전체 조회
                               ├─ 각 유저의 타임존 기준 현재 로컬 시간 계산
                               ├─ 로컬 시간 == 유저 설정 시간? → 푸시 발송
                               └─ 유저 locale(ko/en)에 맞는 메시지 전송
```

## 설정 방법: cron-job.org (무료)

### 1. 가입

[cron-job.org](https://cron-job.org) 접속 → **Sign Up** (이메일 또는 GitHub)

### 2. 크론잡 생성

**Create Cronjob** 클릭 후 아래 설정:

| 항목 | 값 |
|---|---|
| **Title** | `thistory-notifications` |
| **URL** | `https://YOUR_APP.vercel.app/api/cron/notifications` |
| **Schedule** | Every 1 minute (`* * * * *`) |
| **Request Method** | `GET` |
| **Request Timeout** | `30` seconds |

### 3. 인증 헤더 추가

**Advanced** → **Headers** 섹션:

```
Authorization: Bearer YOUR_CRON_SECRET
```

`YOUR_CRON_SECRET`은 Vercel 환경변수에 설정된 `CRON_SECRET` 값과 동일해야 합니다.

### 4. 저장 및 활성화

**Create** 클릭 → 크론잡이 즉시 활성화됩니다.

## 로컬 테스트

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notifications
```

응답 예시:

```json
{
  "sent": 1,
  "failed": 0,
  "checked": 5
}
```

- `checked`: 알림 활성화된 전체 유저 수
- `sent`: 현재 시간에 매칭되어 발송된 수
- `failed`: 발송 실패 수

## vercel.json

Vercel Hobby 플랜에서는 크론을 사용하지 않으므로 `vercel.json`에 crons 설정이 없습니다. Pro 플랜 업그레이드 시 아래 설정으로 외부 크론 없이 매분 실행 가능:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "* * * * *"
    }
  ]
}
```

## 대안 서비스

cron-job.org 외에도 무료로 사용 가능한 서비스:

| 서비스 | 최소 간격 | 무료 한도 |
|---|---|---|
| [cron-job.org](https://cron-job.org) | 1분 | 무제한 |
| [EasyCron](https://www.easycron.com) | 1분 | 200회/일 |
| [Upstash QStash](https://upstash.com/docs/qstash) | 1분 | 500회/일 |

## 트러블슈팅

### 알림이 안 오는 경우

1. cron-job.org 대시보드에서 **실행 로그** 확인 — HTTP 200 응답인지
2. HTTP 401이면 `Authorization` 헤더의 `CRON_SECRET` 값이 Vercel 환경변수와 동일한지 확인
3. `checked > 0`, `sent = 0`이면 유저의 로컬 시간과 설정 시간이 아직 매칭되지 않은 것
4. 설정 페이지에서 알림이 활성화되어 있고, 푸시 구독이 정상인지 확인

### 중복 알림

- 크론이 정확히 1분 간격으로 실행되면 중복 없음
- `getCurrentLocalTime`이 `HH:MM` 포맷이므로 같은 분 내 2회 호출되더라도 1회만 매칭
- 단, 처리 시간이 1분을 넘기면 다음 크론과 겹칠 수 있음 → 유저 수가 매우 많으면 Queue 기반으로 전환 필요
