# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"이류월드 계산기" - 모바일 게임 이류월드(이세계에선 내가 1억 과금러!?)의 각종 게임 데이터 계산기 모음 사이트. 빌드 도구 없이 순수 HTML/CSS/JS(ES modules)로 구성된 정적 사이트이며, Vercel(배포 도메인 `iryuworldcalc.vercel.app`)을 통해 서비스된다. 별도 GitHub Pages용 정적 사이트로도 동작 가능하지만, Discord 알림 기능은 Vercel `vercel.json` rewrite에 의존한다.

- 리포지토리: https://github.com/dlrjsdl234-ctrl/my-site
- 게임 링크: https://maplestoryworlds.nexon.com/ko/play/a39450cd781d418190b9d4419c330eac/

## Development

빌드 도구가 없다. `package.json`, lockfile, CI, 테스트/린트 스크립트가 모두 없으므로 `npm test`, `npm run build` 같은 명령을 추정하지 말 것.

ES module과 CSV `fetch`를 사용하므로 `file://` 프로토콜에서는 동작하지 않는다. 반드시 HTTP 서버에서 확인:
```
npx serve .
# 또는
python3 -m http.server 4173
```

### 검증 방법
자동 테스트가 없다. 변경 검증은 다음과 같이 한다:
- 계산 로직 변경 → 해당 `pages/calc/*.html`을 브라우저에서 열고 대표 입력값으로 결과를 수동 확인
- 테이블 변경 → 해당 `pages/tables/*.html`을 브라우저에서 열고 CSV 네트워크 요청에 404가 없는지 확인
- 사이드바/경로 변경 → 루트(`index.html`)와 `/pages/...` 양쪽에서 링크가 깨지지 않는지 확인
- 레벨업 알림 변경 → `pages/tools/level-alert.html`에서 화면 공유 권한, OCR 영역 선택, 알림음/오버레이, Discord 인증 시 DM 발송까지 수동 확인

### 데이터 업데이트 워크플로우
1. xlsx 파일 수정 (루트 디렉토리, 예: `건버드의 이류월드 계산기2026-04-21.xlsx`)
2. `scripts/xlsx-to-csv.js`의 `XLSX_FILE` 상수가 실제 파일명과 일치하는지 먼저 확인 (하드코딩됨)
3. `npm install xlsx && node scripts/xlsx-to-csv.js` — xlsx → CSV 변환
4. `node scripts/clean-csv.js` — 빈 행 제거

xlsx 파일은 `.gitignore`(`*.xlsx`)로 커밋되지 않는다. 실제 배포/런타임 기준 데이터는 `datas/`의 CSV다.

## Architecture

### 디렉토리 구조
```
my-site/
├── index.html                  # 홈
├── vercel.json                 # /api/* → Discord 봇 API rewrite
├── css/style.css               # 전체 사이트 공통 스타일
├── js/
│   ├── common.js               # 사이드바 동적 생성 + 테마 + 네비게이션 (일반 스크립트)
│   ├── csv-loader.js           # CSV fetch & parse 유틸 (ES module)
│   ├── table-viewer.js         # 단일 CSV 테이블 렌더러 (ES module)
│   ├── multi-table-viewer.js   # 드롭다운 기반 멀티테이블 뷰어 (ES module)
│   ├── storage.js              # localStorage 입력값 저장/복원 유틸 (ES module)
│   ├── level-alert.js          # 레벨업 알림 페이지 로직 (OCR + Discord DM)
│   └── calc/                   # 계산기 로직 (ES modules)
│       ├── exp.js              # 경험치 계산 + 사이클 최적화
│       ├── artifact.js         # 유물 분배 계산
│       ├── rpskill.js          # RP 스킬 계산
│       ├── rpMachine.js        # 환포 계산
│       └── screen-exp.js       # 화면 캡처 + 프레임 추출 유틸 (level-alert도 사용)
├── pages/
│   ├── calc/                   # 계산기 페이지 (rpMachine, exp, artifact, rpskill, discode)
│   ├── tables/                 # 테이블 디스플레이 페이지 (transcend, monster, tips, rpskill-order, town-defense, sp-skill, rpskill-perf, artifact-info, hanpo, isekai-perf, monster-stat)
│   └── tools/                  # 부가 기능 (level-alert.html)
├── datas/                      # 게임 데이터 (CSV)
│   ├── *.csv                   # 단일 테이블용 (exp.csv, hanpo-table.csv, monster.csv, tips.csv 등)
│   ├── artifacts/              # 유물 데이터 (meta.csv + levels.csv)
│   ├── rpskill/                # RP 스킬 데이터 (meta.csv + table1~20.csv)
│   ├── artifact-info/          # 유물 상세정보 (meta.csv + 개별 CSV)
│   ├── sp-skill/               # SP 스킬 (meta.csv + 개별 CSV)
│   ├── rpskill-perf/           # RP 스킬 성능 (meta.csv + 개별 CSV)
│   └── isekai-perf/            # 이세계 스킬 성능 (meta.csv + 개별 CSV)
├── assets/
│   ├── mainImg.png
│   └── guide/                  # 사용법 이미지 (level-alert-guide.svg, screen-exp-roi-guide.webp)
└── scripts/                    # 데이터 변환 스크립트 (Node.js)
    ├── xlsx-to-csv.js          # xlsx → CSV (XLSX_FILE 상수 하드코딩)
    ├── csv-utils.js            # UTF-8 BOM 포함 CSV 쓰기 유틸 (다른 스크립트가 사용)
    ├── extract-js-data.js      # 레거시 JS 데이터 → CSV (최초 마이그레이션용)
    ├── extract-all-from-xlsx.js # xlsx 전체 시트 추출
    ├── gen-table-pages.js      # 테이블 페이지 일괄 생성 (현재 HTML 패턴보다 오래되었을 수 있음 — 실행 전 비교)
    ├── clean-csv.js            # 빈 행 제거
    ├── split-horizontal-csv.js # 넓은 CSV 분할
    └── rename-csv-to-en.js     # CSV 칼럼명 변환
```

### 사이드바와 단일 진실 공급원
모든 페이지가 통일된 사이드바 레이아웃을 사용한다. **`js/common.js`의 `MENU` 배열이 사이드바의 단일 진실 공급원**이다. 새 페이지 추가, 메뉴명 변경, 메뉴 순서 조정은 반드시 `MENU` 배열을 함께 갱신해야 한다(주석 처리된 항목으로 일시적으로 숨길 수도 있음). 섹션은 `홈 / 계산기 / 기능 / 테이블`로 구성되어 있다.

`common.js`는 일반 `<script>`로 로드되고, 나머지(공용 유틸/계산기/레벨 알림)는 모두 ES module(`<script type="module">`)이다.

### 경로 처리
`common.js`는 사이드바 링크를 루트 기준 절대 경로(`/index.html`, `/pages/...`)로 정의하고, `getBasePath()`가 현재 페이지 위치를 보고 상대 경로로 변환한다. 현재 분기는 루트(`/index.html`)와 `/pages/...` 두 단계만 처리하므로(`pages/calc`, `pages/tables`, `pages/tools` 모두 동일 depth), **새 페이지의 depth가 다르면 `getBasePath()`도 함께 수정**해야 한다.

### 데이터 흐름
xlsx → CSV → 런타임 fetch. 게임 데이터의 원본은 루트의 xlsx 파일이지만 git에 포함되지 않을 수 있고, 실질적인 데이터 소스는 `datas/`의 CSV다. 계산기와 테이블 페이지는 `csv-loader.js`를 통해 런타임에 CSV를 fetch한다.

### 테이블 뷰어 (2종)

**단일 테이블 (`table-viewer.js`)**
- `renderTable(csvPath, containerId, options)` 호출
- 옵션: `search`(검색), `sortable`(정렬), `levelFilter`(레벨 필터), `searchColumn`(특정 칼럼 검색), `searchPlaceholder`
- 빈 칼럼 자동 숨김, 행 수 표시

**멀티테이블 (`multi-table-viewer.js`)**
- 디렉토리에 `meta.csv`(`name,file` 칼럼, 선택적 `desc`)가 있으면 드롭다운으로 여러 CSV를 전환하는 패턴
- `renderMultiTable(dirPath, containerId, options)` 호출
- `artifact-info/`, `sp-skill/`, `rpskill-perf/`, `isekai-perf/` 등에서 사용

### 계산기 모듈 패턴
각 계산기(`js/calc/*.js`)는 동일한 구조를 따른다:
1. `initData()` — CSV 데이터 로딩 (async)
2. 계산 함수 export — 입력값을 받아 결과 객체 반환
3. HTML 페이지의 인라인 `<script type="module">`에서 import 후 폼 이벤트에 연결
4. `storage.js`의 `saveInputs(pageKey, data)` / `loadInputs(pageKey)`로 사용자 입력값을 localStorage에 저장/복원 (페이지 재방문 시 이전 입력값 유지)

### 화면 캡처 / OCR 기능
- `js/calc/screen-exp.js`가 `getDisplayMedia` 기반 화면 캡처 + 프레임 캔버스 추출 유틸을 제공한다. 경험치 측정기와 레벨업 알림이 공유한다.
- 레벨업 알림(`pages/tools/level-alert.html` + `js/level-alert.js`)은 화면 캡처 → 사용자가 드래그한 ROI를 매 1초 OCR(Tesseract.js, CDN 로드)로 인식 → 후보 레벨이 목표 이상일 때만 **연속 10회 검증**되면 확정한다. 목표 미만 인식은 검증 카운트를 리셋한다.
- 기본 알림은 브라우저 오버레이 + 약 3초 알림음(WebAudio). Discord 인증된 사용자라면 추가로 DM을 발송한다.
- ROI 좌표는 `iryu_level_alert_roi`에 저장한다.
- 가이드 이미지는 `assets/guide/level-alert-guide.svg`, `assets/guide/screen-exp-roi-guide.webp`다. 새 페이지에서 가이드를 추가할 때 동일 디렉토리를 사용한다.

### Discord OAuth / DM 알림 API
루트 `vercel.json`이 `/api/*` → `https://iryu-discord-bot.vercel.app/api/*`로 rewrite한다. **프론트는 항상 상대경로(`/api/...`)만 사용**한다. 절대 URL 호출은 cross-origin이 되어 세션 쿠키가 따라가지 않으므로 금지.

엔드포인트:
- `GET /api/auth/login` — Discord OAuth 동의 화면으로 302 redirect. 반드시 `<a href="/api/auth/login">` 또는 `window.location.href`로 이동(브라우저가 redirect를 따라가야 함). `fetch('/api/auth/login')`은 동작하지 않는다.
- `GET /api/me` — 로그인 상태 확인. 200이면 `{id, username, global_name}`, 401이면 비로그인/세션만료.
- `POST /api/notify` — 본인에게 DM 발송. body `{ message: string }`. 502 `dm_channel_failed`는 봇과 사용자가 공유 서버 없음 → UI에서 봇 서버 인바이트 안내 필요.
- `GET /api/hello` — 헬스체크.

자세한 상태 코드/디버깅은 `api-guide.md` 참조. 새 알림 기능을 붙일 때 CORS 헤더 추가나 절대 URL 호출은 시도하지 말 것.

### 테마 관리
`common.js`가 `light` / `dark` / `system` 3-state 테마를 관리한다. localStorage 키 `iryu_theme`에 저장하며, `system`은 `prefers-color-scheme`을 따른다. 사이드바의 `.theme-toggle` 버튼이 UI를 제공한다. 깜빡임을 막기 위해 모든 HTML `<head>`에 인라인 테마 초기화 스크립트가 들어간다 — 새 페이지를 만들 때도 이 스크립트를 그대로 유지한다.

## 페이지 추가 패턴

**단일 테이블 페이지:**
1. `datas/`에 CSV 파일 추가 (CSV 직접 생성 시 `scripts/csv-utils.js`로 UTF-8 BOM 포함하여 쓰기)
2. 기존 `pages/tables/*.html`을 복사하여 `renderTable` 경로/제목/옵션 변경
3. `js/common.js`의 `MENU` 배열에 항목 추가

**멀티테이블 페이지 (드롭다운):**
1. `datas/<디렉토리>/`에 `meta.csv`(`name,file`, 선택 `desc`) + 개별 CSV 파일 추가
2. 기존 멀티테이블 HTML(예: `sp-skill.html`)을 복사하여 `renderMultiTable` 디렉토리 경로/제목 변경
3. `js/common.js`의 `MENU` 배열에 항목 추가

`scripts/gen-table-pages.js`는 현재 페이지 패턴보다 오래된 템플릿일 수 있다. 실행 전 현재 HTML의 테마 초기화 스크립트와 멀티테이블 전환 여부를 비교한 뒤 사용한다.

## Conventions

- UI 텍스트와 주석은 한국어로 작성
- HTML/CSV 파일명: kebab-case (`monster-stat.html`, `hanpo-table.csv`)
- JS 파일명: camelCase (`rpMachine.js`) 또는 kebab-case (`csv-loader.js`)
- 숫자 포맷: `toLocaleString("ko-KR")` 사용
- CSV 칼럼명: 한국어 사용 (예: `레벨`, `누적 RP`)
- CSV 파일 인코딩: UTF-8 BOM (Node.js 스크립트에서 직접 쓸 때는 `scripts/csv-utils.js` 사용)
- localStorage 키: `iryu_` 접두어 사용 (예: `iryu_expCalc_level`, `iryu_theme`, `iryu_level_alert_roi`)
- Discord 알림 API는 항상 `/api/...` 상대경로로만 호출, CORS 헤더 추가 금지
