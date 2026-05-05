# 이류월드 계산기

모바일 게임 **이류월드**(이세계에선 내가 1억 과금러!?)의 각종 게임 데이터 계산기 모음 사이트입니다.

빌드 도구 없이 순수 HTML/CSS/JavaScript(ES modules)로 구성된 정적 사이트이며, GitHub Pages로 배포됩니다.

## 주요 기능

### 계산기
- **환포 계산기** — 환포 달성에 필요한 레벨 계산 (배율 스택 적용)
- **경험치 계산기** — 목표 레벨까지 소요 시간 계산
- **유물 계산기** — 수호석 균등 분배 최적화
- **RP 스킬 계산기** — 스킬 레벨업에 필요한 RP 계산
- **경험치 측정기** — 화면 캡처 기반 경험치 바 측정으로 1분당 경험치 추정

### 기능
- **레벨업 알림** — 화면의 현재 레벨 영역을 OCR로 감시하고 목표 레벨 도달 시 브라우저 알림음/오버레이로 알림
- Discord 인증 상태에서는 목표 도달 시 Discord DM도 함께 발송

### 테이블
- 초월정보, 몬스터 스탯, RP 스킬, SP 스킬, 유물, 환포표, 이세계 스킬 등 게임 데이터 열람

## 로컬 개발

ES module과 CSV `fetch`를 사용하므로 반드시 HTTP 서버가 필요합니다. `file://`로 열면 일부 페이지가 동작하지 않습니다.

```bash
npx serve .
```

`npx`가 없는 환경에서는 간단히 아래처럼 확인할 수 있습니다.

```bash
python3 -m http.server 4173
```

## Discord 알림 API

루트 `vercel.json`에서 `/api/*`를 별도 Discord 봇 API로 프록시합니다. 프론트 코드는 항상 상대경로를 사용합니다.

- 로그인: `/api/auth/login`으로 브라우저 이동
- 로그인 상태: `GET /api/me`
- DM 발송: `POST /api/notify`

자세한 통합 메모는 `api-guide.md`를 참고하세요.

## 수동 검증

- 계산기 변경: 관련 `pages/calc/*.html`을 HTTP 서버에서 열고 대표 입력값으로 결과 확인
- 테이블/CSV 변경: 관련 `pages/tables/*.html`에서 데이터 로드와 네트워크 404 확인
- 메뉴/경로 변경: `index.html`과 `/pages/...` 양쪽에서 사이드바 링크 확인
- 레벨업 알림 변경: `pages/tools/level-alert.html`에서 화면 공유 권한, OCR 영역 선택, 브라우저 알림음/오버레이, Discord 인증 시 DM 발송 확인

## 데이터 업데이트

```bash
npm install xlsx
node scripts/xlsx-to-csv.js    # xlsx → CSV 변환
node scripts/clean-csv.js      # 빈 행 제거
```

## 링크

- [이류월드 플레이](https://maplestoryworlds.nexon.com/ko/play/a39450cd781d418190b9d4419c330eac/)
- [이류월드 디스코드](https://discord.gg/WjDNES7n4t)

## Contributors

기여해주신 분들께 감사드립니다.

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/hyuNi33">
        <img src="https://github.com/hyuNi33.png" width="80" height="80" style="border-radius:50%;" alt="hyuNi33"><br>
        <sub><b>hyuNi33</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/dlrjsdl234-ctrl">
        <img src="https://github.com/dlrjsdl234-ctrl.png" width="80" height="80" style="border-radius:50%;" alt="dlrjsdl234-ctrl"><br>
        <sub><b>dlrjsdl234-ctrl</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/gatsukichi">
        <img src="https://github.com/gatsukichi.png" width="80" height="80" style="border-radius:50%;" alt="katsukichi"><br>
        <sub><b>katsukichi</b></sub>
      </a>
    </td>
  </tr>
</table>
