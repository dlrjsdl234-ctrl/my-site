# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"이류월드 계산기" - 모바일 게임 이류월드(이세계에선 내가 1억 과금러!?)의 각종 게임 데이터 계산기 모음 사이트. 빌드 도구 없이 순수 HTML/CSS/JS(ES modules)로 구성된 정적 사이트이며, GitHub Pages로 배포된다.

## Directory Structure

```
my-site/
├── index.html                  # 홈
├── css/style.css               # 전체 사이트 공통 스타일
├── js/
│   ├── common.js               # 사이드바 동적 생성 + 네비게이션 (일반 스크립트)
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
│   ├── calc/                   # 계산기 페이지 (4개)
│   │   ├── exp.html
│   │   ├── artifact.html
│   │   ├── rpskill.html
│   │   └── rpMachine.html
│   └── tables/                 # 테이블 디스플레이 페이지 (10개)
│       ├── transcend.html, monster-stat.html, tips.html, ...
│       └── (table-viewer.js 또는 multi-table-viewer.js로 CSV 렌더링)
├── datas/                      # 게임 데이터 (CSV)
│   ├── exp.csv                 # 레벨별 경험치
│   ├── hanpo-table.csv         # 레벨별 환포
│   ├── artifacts/              # 유물 데이터 (meta.csv + levels.csv)
│   ├── rpskill/                # RP 스킬 데이터 (meta.csv + table1~20.csv)
│   ├── artifact-info/          # 유물 상세정보 (meta.csv + 개별 CSV)
│   ├── sp-skill/               # SP 스킬 (meta.csv + 개별 CSV)
│   ├── rpskill-perf/           # RP 스킬 성능 (meta.csv + 개별 CSV)
│   ├── isekai-perf/            # 이세계 스킬 성능 (meta.csv + 개별 CSV)
│   └── *.csv                   # 테이블 디스플레이용 데이터
├── assets/mainImg.png
└── scripts/                    # 데이터 변환 스크립트
    ├── xlsx-to-csv.js          # xlsx → CSV 변환
    ├── extract-js-data.js      # 레거시 JS 데이터 → CSV (최초 마이그레이션용)
    ├── extract-all-from-xlsx.js # xlsx 전체 시트 추출
    ├── gen-table-pages.js      # 테이블 페이지 일괄 생성
    ├── clean-csv.js            # 빈 행 제거
    ├── split-horizontal-csv.js # 넓은 CSV 분할
    └── rename-csv-to-en.js     # CSV 칼럼명 변환
```

## Architecture

### 레이아웃 & 사이드바
모든 페이지가 통일된 사이드바 레이아웃을 사용한다. `js/common.js`가 사이드바 HTML을 동적으로 생성하므로, 메뉴 항목 추가/변경 시 `common.js`의 `MENU` 배열만 수정하면 된다.

### 모듈 시스템
- `js/common.js`만 일반 `<script>` 태그 (모든 페이지에서 사이드바 생성)
- 나머지 JS는 모두 ES module (`<script type="module">`)

### 데이터 흐름
게임 데이터의 원본은 xlsx 파일이다. `scripts/xlsx-to-csv.js`로 CSV를 추출하고, 계산기와 테이블 페이지는 `csv-loader.js`를 통해 런타임에 CSV를 fetch한다.

### 테이블 뷰어 (2종)

**단일 테이블 (`table-viewer.js`)**
- `renderTable(csvPath, containerId, options)` 호출
- 옵션: `search`(검색), `sortable`(정렬), `levelFilter`(레벨 필터), `searchColumn`(특정 칼럼 검색), `searchPlaceholder`
- 빈 칼럼 자동 숨김, 행 수 표시

**멀티테이블 (`multi-table-viewer.js`)**
- 디렉토리에 `meta.csv`(name, file 칼럼)가 있으면 드롭다운으로 여러 CSV를 전환하는 패턴
- `renderMultiTable(dirPath, containerId, options)` 호출
- `artifact-info/`, `sp-skill/`, `rpskill-perf/`, `isekai-perf/` 등에서 사용

### 계산기 모듈 패턴
각 계산기(`js/calc/*.js`)는 동일한 구조를 따른다:
1. `initData()` — CSV 데이터 로딩 (async)
2. 계산 함수 export — 입력값을 받아 결과 객체 반환
3. HTML 페이지의 인라인 `<script type="module">`에서 import 후 폼 이벤트에 연결

## Development

빌드 도구 없음. package.json도 없음. 로컬에서 HTTP 서버로 확인:
```
npx serve .
```
ES module 사용으로 `file://` 프로토콜에서는 CORS 에러가 발생하므로 반드시 HTTP 서버를 사용해야 한다.

### 데이터 업데이트 워크플로우
1. xlsx 파일 수정
2. `npm install xlsx && node scripts/xlsx-to-csv.js` — xlsx → CSV 변환 (xlsx 패키지는 글로벌 또는 임시 설치)
3. `node scripts/clean-csv.js` — 빈 행 제거

### 새 테이블 페이지 추가

**단일 테이블 페이지:**
1. `datas/`에 CSV 파일 추가
2. 기존 테이블 HTML을 복사하여 CSV 경로/제목 변경 (또는 `scripts/gen-table-pages.js` 사용)
3. `js/common.js`의 `MENU` 배열에 항목 추가

**멀티테이블 페이지 (드롭다운):**
1. `datas/새디렉토리/`에 `meta.csv`(name, file 칼럼) + 개별 CSV 파일 추가
2. 기존 멀티테이블 HTML(예: `sp-skill.html`)을 복사하여 디렉토리 경로/제목 변경
3. `js/common.js`의 `MENU` 배열에 항목 추가

## Conventions

- UI 텍스트와 주석은 한국어로 작성
- HTML/CSV 파일명: kebab-case (`monster-stat.html`, `hanpo-table.csv`)
- JS 파일명: camelCase (`rpMachine.js`) 또는 kebab-case (`csv-loader.js`)
- 숫자 포맷: `toLocaleString("ko-KR")` 사용
- CSV 칼럼명: 한국어 사용 (예: `레벨`, `누적 RP`)
- localStorage 키: `iryu_` 접두어 사용 (예: `iryu_expCalc_level`)
- 경로: `common.js`가 루트 기준 절대 경로(`/index.html`, `/pages/...`)로 사이드바 링크를 생성하고 `getBasePath()`로 상대 변환. 새 페이지 depth 변경 시 `getBasePath()` 분기 확인 필요
