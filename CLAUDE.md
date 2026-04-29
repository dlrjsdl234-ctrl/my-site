# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"이류월드 계산기" - 모바일 게임 이류월드(이세계에선 내가 1억 과금러!?)의 각종 게임 데이터 계산기 모음 사이트. 빌드 도구 없이 순수 HTML/CSS/JS(ES modules)로 구성된 정적 사이트이며, GitHub Pages로 배포된다.

- 리포지토리: https://github.com/dlrjsdl234-ctrl/my-site
- 게임 링크: https://maplestoryworlds.nexon.com/ko/play/a39450cd781d418190b9d4419c330eac/

## Development

빌드 도구가 없다. `package.json`, lockfile, CI, 테스트/린트 스크립트가 모두 없으므로 `npm test`, `npm run build` 같은 명령을 추정하지 말 것.

ES module을 사용하므로 `file://` 프로토콜에서는 CORS로 실패한다. 반드시 HTTP 서버에서 확인:
```
npx serve .
```

### 검증 방법
자동 테스트가 없다. 변경 검증은 다음과 같이 한다:
- 계산 로직 변경 → 해당 `pages/calc/*.html`을 브라우저에서 열고 대표 입력값으로 결과를 수동 확인
- 테이블 변경 → 해당 `pages/tables/*.html`을 브라우저에서 열고 CSV 네트워크 요청에 404가 없는지 확인
- 사이드바/경로 변경 → 루트(`index.html`)와 `/pages/...` 양쪽에서 링크가 깨지지 않는지 확인

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
├── css/style.css               # 전체 사이트 공통 스타일
├── js/
│   ├── common.js               # 사이드바 동적 생성 + 테마 + 네비게이션 (일반 스크립트)
│   ├── csv-loader.js           # CSV fetch & parse 유틸 (ES module)
│   ├── table-viewer.js         # 단일 CSV 테이블 렌더러 (ES module)
│   ├── multi-table-viewer.js   # 드롭다운 기반 멀티테이블 뷰어 (ES module)
│   ├── storage.js              # localStorage 입력값 저장/복원 유틸 (ES module)
│   └── calc/                   # 계산기 로직 (ES modules)
│       ├── exp.js              # 경험치 계산 + 사이클 최적화
│       ├── artifact.js         # 유물 분배 계산
│       ├── rpskill.js          # RP 스킬 계산
│       └── rpMachine.js        # 환포 계산
├── pages/
│   ├── calc/                   # 계산기 페이지 (rpMachine, exp, artifact, rpskill)
│   └── tables/                 # 테이블 디스플레이 페이지 (transcend, monster, tips, rpskill-order, town-defense, sp-skill, rpskill-perf, artifact-info, hanpo, isekai-perf, monster-stat)
├── datas/                      # 게임 데이터 (CSV)
│   ├── *.csv                   # 단일 테이블용 (exp.csv, hanpo-table.csv, monster.csv, tips.csv 등)
│   ├── artifacts/              # 유물 데이터 (meta.csv + levels.csv)
│   ├── rpskill/                # RP 스킬 데이터 (meta.csv + table1~20.csv)
│   ├── artifact-info/          # 유물 상세정보 (meta.csv + 개별 CSV)
│   ├── sp-skill/               # SP 스킬 (meta.csv + 개별 CSV)
│   ├── rpskill-perf/           # RP 스킬 성능 (meta.csv + 개별 CSV)
│   └── isekai-perf/            # 이세계 스킬 성능 (meta.csv + 개별 CSV)
├── assets/mainImg.png
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
모든 페이지가 통일된 사이드바 레이아웃을 사용한다. **`js/common.js`의 `MENU` 배열이 사이드바의 단일 진실 공급원**이다. 새 페이지 추가, 메뉴명 변경, 메뉴 순서 조정은 반드시 `MENU` 배열을 함께 갱신해야 한다(주석 처리된 항목으로 일시적으로 숨길 수도 있음).

`common.js`는 일반 `<script>`로 로드되고, 나머지(공용 유틸/계산기)는 모두 ES module(`<script type="module">`)이다.

### 경로 처리
`common.js`는 사이드바 링크를 루트 기준 절대 경로(`/index.html`, `/pages/...`)로 정의하고, `getBasePath()`가 현재 페이지 위치를 보고 상대 경로로 변환한다. 현재 분기는 루트(`/index.html`)와 `/pages/...` 두 단계만 처리하므로, **새 페이지의 depth가 다르면 `getBasePath()`도 함께 수정**해야 한다.

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

### 테마 관리
`common.js`가 `light` / `dark` / `system` 3-state 테마를 관리한다. localStorage 키 `iryu_theme`에 저장하며, `system`은 `prefers-color-scheme`을 따른다. 사이드바의 `.theme-toggle` 버튼이 UI를 제공한다.

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
- localStorage 키: `iryu_` 접두어 사용 (예: `iryu_expCalc_level`, `iryu_theme`)
