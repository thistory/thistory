# 크론잡 설정 가이드

유저별 분 단위 알림을 위해 외부 크론으로 매분 `/api/cron/notifications`를 호출합니다.
Vercel Hobby 플랜은 크론 최소 간격이 1일이므로 [cron-job.org](https://cron-job.org) (무료)를 사용합니다.

## 동작 흐름

```
[cron-job.org] ──매분 GET──▶ /api/cron/notifications
                               ├─ CRON_SECRET 인증
                               ├─ 알림 활성화 유저 조회
                               ├─ 유저 타임존 기준 로컬 시간 == 설정 시간?
                               └─ 매칭 시 locale(ko/en)에 맞는 푸시 발송
```

## 설정

### 1. CRON_SECRET 확인

[vercel.com](https://vercel.com) → thistory → **Settings** → **Environment Variables** → `CRON_SECRET` 값 복사

### 2. cron-job.org 크론잡 생성

[cron-job.org](https://cron-job.org) 가입 → **Cronjobs** → **Create Cronjob**:

| 항목 | 값 |
|---|---|
| Title | `thistory-notifications` |
| URL | `https://thistory.vercel.app/api/cron/notifications` |
| Schedule | Every 1 minute |
| Request Method | GET |

**Advanced** → **Headers**에 추가:

```
Authorization: Bearer {CRON_SECRET 값}
```

**Create** 클릭하면 즉시 활성화됩니다.

### 3. 동작 확인

cron-job.org **History** 탭에서 확인:

| 응답 | 의미 |
|---|---|
| `200` `{"sent":0,"checked":0}` | 정상 (매칭 유저 없음) |
| `200` `{"sent":2,"checked":5}` | 정상 (5명 중 2명에게 발송) |
| `401` | CRON_SECRET 불일치 |

로컬 테스트:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/notifications
```

## Vercel Pro 플랜인 경우

외부 크론 없이 `vercel.json`으로 매분 실행 가능:

```json
{
  "crons": [{ "path": "/api/cron/notifications", "schedule": "* * * * *" }]
}
```

## 트러블슈팅

| 증상 | 확인 |
|---|---|
| 401 응답 | Authorization 헤더의 CRON_SECRET이 Vercel 환경변수와 동일한지 |
| checked > 0, sent = 0 | 유저 로컬 시간이 설정 시간과 아직 안 맞음 (정상) |
| 알림이 안 옴 | Settings에서 알림 활성화 + 푸시 구독 정상인지 확인 |
