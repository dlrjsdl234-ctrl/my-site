# AGENTS.md

## 프로젝트 성격
- 빌드 도구 없는 정적 사이트다. `package.json`, lockfile, CI, 테스트/린트 스크립트가 없으므로 `npm test`, `npm run build` 같은 명령을 추정하지 말 것.
- 런타임 데이터는 `datas/**/*.csv`를 브라우저에서 `fetch`로 읽는다. ES module과 CSV fetch 때문에 `file://` 확인은 실패할 수 있다.
- Discord OAuth/DM API는 루트 `vercel.json`이 `/api/*`를 `https://iryu-discord-bot.vercel.app/api/*`로 rewrite한다. 프론트에서는 항상 `/api/...` 상대경로만 사용한다.

## 실행과 검증
- 로컬 확인: `npx serve .` 또는 `python3 -m http.server 4173`처럼 HTTP 서버로 연다.
- 변경 검증은 HTTP 서버에서 관련 HTML 페이지를 직접 열어 한다. 계산기 변경은 해당 `pages/calc/*.html`, 테이블 변경은 해당 `pages/tables/*.html`을 확인한다.
- 자동 테스트가 없으므로 계산 로직 변경 시 대표 입력값으로 브라우저 결과를 수동 확인하고, CSV/asset 경로 변경 시 네트워크 404가 없는지 확인한다.
- 사이드바/경로 변경은 `index.html`과 `/pages/...` 양쪽에서 링크가 깨지지 않는지 확인한다.
- 레벨업 알림은 `getDisplayMedia`, WebAudio, Tesseract.js CDN, Discord 세션 쿠키에 의존한다. 실제 OCR/알림/DM은 배포 또는 HTTP 로컬 페이지에서 브라우저 권한을 허용해 수동 확인한다.

## 구조상 중요한 진실 공급원
- 사이드바 메뉴는 `js/common.js`의 `MENU`가 단일 진실 공급원이다. 새 페이지를 추가하거나 메뉴명을 바꾸면 HTML뿐 아니라 `MENU`도 갱신한다.
- `common.js`는 일반 `<script>`로 로드되고, 나머지 공용/기능 JS는 ES module(`<script type="module">`)이다.
- `common.js#getBasePath()`는 루트와 `/pages/...` 깊이만 처리한다. 다른 depth에 HTML을 추가하면 링크/초기화 경로를 함께 점검한다.
- 계산기 페이지는 HTML 안의 인라인 `<script type="module">`이 `js/calc/*.js`의 초기화/계산 함수와 `js/storage.js`를 연결한다.
- 레벨업 알림 페이지는 `pages/tools/level-alert.html`, 로직은 `js/level-alert.js`, 예시 이미지는 `assets/guide/level-alert-guide.svg`다.
- 단일 CSV 테이블은 `renderTable(csvPath, containerId, options)`, `meta.csv` 기반 드롭다운 테이블은 `renderMultiTable(dirPath, containerId, options)` 패턴을 따른다.
- 테마는 `common.js`가 `light` / `dark` / `system` 3-state로 관리하고 `iryu_theme`에 저장한다. HTML head의 초기 테마 스크립트를 새 페이지에서도 유지한다.

## Discord/OCR 알림 규칙
- Discord 로그인은 `fetch('/api/auth/login')`가 아니라 `<a href="/api/auth/login">` 또는 `window.location.href`로 이동해야 한다.
- 로그인 상태는 `GET /api/me`, DM 발송은 `POST /api/notify`를 사용한다. 절대 URL API 호출이나 CORS 설정을 추가하지 말 것.
- 레벨업 알림의 기본 알림은 브라우저 오버레이+약 3초 알림음이다. Discord DM은 인증된 경우에만 추가로 보낸다.
- 목표 레벨 판정은 후보 레벨이 목표 이상일 때만 10회 연속 OCR 검증 후 확정한다. 목표 미만 인식은 검증 카운트를 리셋한다.

## 데이터 업데이트
- xlsx 원본은 `.gitignore`의 `*.xlsx` 대상이라 커밋되지 않을 수 있다. 실제 배포/런타임 기준 데이터는 `datas/`의 CSV다.
- xlsx 변환 순서: `npm install xlsx` 후 `node scripts/xlsx-to-csv.js`, 이어서 `node scripts/clean-csv.js`.
- `scripts/xlsx-to-csv.js`는 입력 파일명을 `XLSX_FILE`에 하드코딩한다. 새 xlsx를 쓰려면 실제 파일명과 먼저 맞춘다.
- CSV 쓰기 스크립트는 `scripts/csv-utils.js`를 통해 UTF-8 BOM을 붙인다. 직접 CSV를 대량 생성/변환할 때 인코딩이 깨지지 않게 이 유틸을 우선 사용한다.

## 페이지 추가 패턴
- 새 단일 테이블: `datas/*.csv` 추가, 기존 `pages/tables/*.html` 복사 후 `renderTable` 경로/옵션 수정, `js/common.js`의 `MENU` 갱신.
- 새 멀티테이블: `datas/<dir>/meta.csv`에 `name,file`(선택 `desc`)을 두고 개별 CSV를 추가, 기존 멀티테이블 HTML 패턴을 복사, `MENU` 갱신.
- `scripts/gen-table-pages.js`는 현재 페이지 패턴보다 오래된 템플릿일 수 있다. 실행 전 현재 HTML의 테마 초기화 스크립트와 멀티테이블 전환 여부를 비교한다.

## 코드/데이터 관례
- UI 텍스트와 주석은 한국어로 작성한다.
- 숫자 표시는 사용자 화면에서 `toLocaleString("ko-KR")` 사용을 우선한다.
- CSV 칼럼명은 한국어를 사용하고, localStorage 키는 `iryu_` 접두어를 사용한다.
