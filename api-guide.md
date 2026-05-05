# 이류 API 사용 가이드 (프론트 통합용)

> 이류월드 계산기 사이트에 Discord 로그인 + DM 알림 기능을 붙이기 위한 API 문서.
> API 자체는 별도 레포(`iryu-discord-bot`)에서 본인 Vercel로 배포 중이고, 친구 레포의 `vercel.json` rewrite로 same-origin 호출이 가능하도록 셋업 완료.

---

## 셋업 상태 (이미 끝남)

- ✅ API 배포: `https://iryu-discord-bot.vercel.app`
- ✅ 친구 레포 루트 `vercel.json`에 rewrite 등록 → `https://iryuworldcalc.vercel.app/api/*` 호출이 자동으로 API로 프록시됨
- ✅ Discord OAuth 앱 생성, redirect URI 등록
- ✅ 봇 계정 생성 (DM 발송용)
- ✅ end-to-end 테스트 통과 (login → callback → me → notify)

→ **프론트 코드는 `/api/...` 상대경로로만 호출하면 됨.**

---

## 엔드포인트

### `GET /api/auth/login`
Discord OAuth 동의 화면으로 302 redirect.

**호출법**: `<a>` 태그로 직접 이동시켜야 함 (fetch ❌). 302 redirect를 브라우저가 따라가야 하기 때문.

```html
<a href="/api/auth/login">Discord 로그인</a>
```

동의 후 콜백 처리 끝나면 `https://iryuworldcalc.vercel.app`로 자동 복귀하면서 세션 쿠키가 박혀 있음.

---

### `GET /api/me`
현재 로그인 상태 확인 + 사용자 정보 조회.

**응답**:
- `200 OK` + `{ "id": "338355043906173344", "username": "epicshin8061", "global_name": "Epic-Shin" }` — 로그인됨
- `401` + `{ "error": "unauthenticated" }` — 비로그인
- `401` + `{ "error": "invalid_session" }` — 세션 만료/위조 (7일 TTL)

**호출법**:
```js
const res = await fetch('/api/me');
if (res.ok) {
  const user = await res.json();
  // user.id, user.username, user.global_name
} else {
  // 비로그인 상태
}
```

---

### `POST /api/notify`
로그인된 사용자 본인에게 봇이 DM 발송.

**요청**:
```js
await fetch('/api/notify', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ message: '목표 레벨 도달! 알림드립니다.' }),
});
```

**응답**:
- `200 OK` + `{ "ok": true }` — DM 전송 성공
- `400` + `{ "error": "message_required" }` — body에 `message` 누락 / 빈 문자열
- `401` — 비로그인 또는 세션 만료
- `405` — POST 외 메서드
- `502` + `{ "error": "dm_channel_failed", "detail": "..." }` — **봇과 사용자가 공유 서버 없음** (아래 "봇 서버 가입" 항목 참고)
- `502` + `{ "error": "dm_send_failed", "detail": "..." }` — 채널은 생성됐는데 메시지 전송 실패 (rate limit 등)

---

### `GET /api/hello`
헬스체크용. 200 + `{ "ok": true, "ts": <unix_ms> }`. 디버깅 외 용도 없음.

---

## ⚠️ 봇 서버 가입 (필수 안내)

Discord 정책상 **봇과 사용자가 같은 서버에 하나라도 있어야** 봇이 DM을 보낼 수 있음. 그렇지 않으면 `/api/notify` 호출 시 `dm_channel_failed` 502가 떨어짐.

### 사용자 안내 흐름 (수동 가입 방식 — 1차 권장)

1. 봇 전용 Discord 서버를 미리 만들어둠 (운영자가 관리)
2. 영구 인바이트 링크 발급 (`https://discord.gg/<code>`)
3. 프론트에 "Discord 로그인" 옆에 **"알림 받으려면 서버 가입 필요"** 안내 + 인바이트 링크
4. 가입 안 한 사용자가 `/api/notify`를 트리거하면 502가 떨어지니 → 응답 `dm_channel_failed` 받으면 UI에서 "서버 가입 후 다시 시도" 토스트 띄우기

### 자동 가입 방식 (필요시 추후 추가 가능)

OAuth scope에 `guilds.join` 추가하고 봇 토큰으로 `PUT /guilds/{guild_id}/members/{user_id}` 호출하면 로그인 시 자동으로 서버에 강제 가입시킬 수 있음. 사용자가 별도 행동 안 해도 되는 대신, 구현 + 봇 권한(`CREATE_INSTANT_INVITE`) 추가 필요. 지금은 미구현.

---

## 통합 패턴

### 1) 로그인 버튼 + 상태 표시

```jsx
// React 예시
import { useEffect, useState } from 'react';

function LoginButton() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (user) return <span>{user.global_name ?? user.username}</span>;
  return <a href="/api/auth/login">Discord 로그인</a>;
}
```

```html
<!-- 바닐라 예시 -->
<div id="auth"></div>
<script>
fetch('/api/me')
  .then(r => r.ok ? r.json() : null)
  .then(user => {
    document.getElementById('auth').innerHTML = user
      ? `<span>${user.global_name ?? user.username}</span>`
      : `<a href="/api/auth/login">Discord 로그인</a>`;
  });
</script>
```

### 2) 알림 발송 (예: 경험치 계산기 목표 레벨 등록)

```jsx
async function registerNotify(message) {
  const res = await fetch('/api/notify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (res.status === 401) {
    alert('Discord 로그인이 필요합니다.');
    return;
  }
  const data = await res.json();
  if (!res.ok) {
    if (data.error === 'dm_channel_failed') {
      alert('봇 서버에 먼저 가입해주세요: https://discord.gg/<INVITE_CODE>');
      return;
    }
    alert(`알림 발송 실패: ${data.error}`);
    return;
  }
  alert('Discord DM으로 알림이 발송되었습니다.');
}
```

---

## 🚫 금기 사항

1. **절대 URL로 API 호출 금지**
   ```js
   // ❌ 안 됨 - cross-origin이라 쿠키가 안 따라감
   fetch('https://iryu-discord-bot.vercel.app/api/me')

   // ✅ 항상 상대경로
   fetch('/api/me')
   ```

2. **`fetch('/api/auth/login')` 금지** — 302 redirect를 브라우저가 따라가야 하므로 반드시 `<a href>` 또는 `window.location.href`로 이동.

3. **CORS 헤더 추가 시도 금지** — same-origin이라 필요 없음. 추가하면 오히려 브라우저가 의심함.

---

## 미구현 / TODO

| 항목 | 상태 | 메모 |
|---|---|---|
| 로그아웃 (`/api/auth/logout`) | ❌ 미구현 | 세션 쿠키만 만료시키면 됨, 필요시 추가 요청 |
| 자동 봇 서버 가입 (`guilds.join`) | ❌ 미구현 | UX 개선용, 1차 검증 후 도입 결정 |
| 사용자 알림 설정 저장 | ❌ 미구현 | 단순 즉시 발송이면 stateless JWT로 충분. 예약 알림 / 알림 채널 설정 등 필요해지면 Vercel KV (Upstash) 도입 |
| 백그라운드 알림 (예: 정해진 시간에 자동 DM) | ❌ 미구현 | Vercel Cron + KV로 가능 |
| Rate limiting | ❌ 미구현 | 동일 user의 notify 스팸 방지. KV 도입 시 같이 |

---

## 디버깅 가이드

| 증상 | 의심 |
|---|---|
| `/api/me` 호출이 401 | 세션 쿠키 없거나 만료. devtools → Application → Cookies → `iryuworldcalc.vercel.app`에 `session` 있는지 확인 |
| 로그인 후에도 `/api/me`가 401 | 콜백 후 redirect가 다른 도메인으로 갔을 가능성. 본인 Vercel `SITE_URL` env가 `https://iryuworldcalc.vercel.app`인지 확인 |
| `/api/notify` 502 `dm_channel_failed` | 봇과 사용자가 공유 서버 없음 → 봇 서버 가입 |
| `/api/notify` 502 `dm_send_failed` | rate limit 또는 봇 권한 문제. `detail` 필드의 Discord 에러 메시지 참고 |
| `/api/auth/login`이 500 `missing_env` | 본인 Vercel env vars 누락 (`DISCORD_CLIENT_ID`, `SITE_URL`) → 등록 후 재배포 |
| OAuth 콜백에서 400 `invalid_state` | state 쿠키 누락. 보통 SameSite/Secure 정책 충돌. 친구 도메인이 HTTPS인지 확인 |

---

## 환경 변수 (API 서버 측, 본인 Vercel 대시보드)

프론트에서는 신경 쓸 필요 없지만 운영 메모용:

| 키 | 값 |
|---|---|
| `DISCORD_CLIENT_ID` | Discord 앱 Client ID |
| `DISCORD_CLIENT_SECRET` | Discord 앱 Client Secret |
| `DISCORD_BOT_TOKEN` | 봇 토큰 |
| `SITE_URL` | `https://iryuworldcalc.vercel.app` |
| `SESSION_SECRET` | JWT 서명용 (`openssl rand -hex 32`) |

---

## 참고
- 이 API 레포: `gatsukichi/iryu-discord-bot` (프라이빗)
- 본인 Vercel 프로젝트: `iryu-discord-bot.vercel.app`
- Discord 앱: https://discord.com/developers/applications
- Discord OAuth2 docs: https://discord.com/developers/docs/topics/oauth2
- Discord DM API: `POST /users/@me/channels` → `POST /channels/{id}/messages`
