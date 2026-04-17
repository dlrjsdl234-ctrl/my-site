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
│   ├── table-viewer.js         # 범용 테이블 렌더러 (ES module)
│   └── calc/                   # 계산기 로직 (ES modules)
│       ├── exp.js              # 경험치 계산
│       ├── artifact.js         # 유물 분배 계산
│       ├── rpskill.js          # RP 스킬 계산
│       └── rpMachine.js        # 환포 계산
├── pages/
│   ├── calc/                   # 계산기 페이지
│   │   ├── exp.html
│   │   ├── artifact.html
│   │   ├── rpskill.html
│   │   └── rpMachine.html
│   └── tables/                 # 테이블 디스플레이 페이지
│       ├── trait.html, hanpo.html, ...
│       └── (14개 — table-viewer.js로 CSV 렌더링)
├── datas/                      # 게임 데이터 (CSV)
│   ├── exp.csv                 # 레벨별 경험치
│   ├── artifacts/              # 유물 데이터
│   │   ├── meta.csv
│   │   └── levels.csv
│   ├── rpskill/                # RP 스킬 데이터
│   │   ├── meta.csv
│   │   └── table1.csv ~ table20.csv
│   └── *.csv                   # 테이블 디스플레이용 데이터
├── assets/mainImg.png
└── scripts/                    # 일회성 변환 스크립트
    ├── xlsx-to-csv.js
    ├── extract-js-data.js
    └── gen-table-pages.js
```

## Architecture

### 레이아웃 & 사이드바
모든 페이지가 통일된 사이드바 레이아웃을 사용한다. `js/common.js`가 사이드바 HTML을 동적으로 생성하므로, 메뉴 항목 추가/변경 시 `common.js`의 `MENU` 배열만 수정하면 된다.

### 데이터 흐름
게임 데이터의 원본은 xlsx 파일이다. `scripts/xlsx-to-csv.js`로 CSV를 추출하고, 계산기와 테이블 페이지는 `csv-loader.js`를 통해 런타임에 CSV를 fetch한다.

### 테이블 디스플레이 페이지
`js/table-viewer.js`를 사용하는 동일한 템플릿으로, CSV 경로와 제목만 다르다. `scripts/gen-table-pages.js`로 일괄 생성 가능.

### 모듈 시스템
- `js/common.js`만 일반 `<script>` 태그 (모든 페이지에서 사이드바 생성)
- 나머지 JS는 모두 ES module (`<script type="module">`)

## Development

빌드 도구 없음. 로컬에서 HTTP 서버로 확인:
```
npx serve .
```
ES module 사용으로 `file://` 프로토콜에서는 CORS 에러가 발생하므로 반드시 HTTP 서버를 사용해야 한다.

### 데이터 업데이트 워크플로우
1. xlsx 파일 수정
2. `npm install xlsx && node scripts/xlsx-to-csv.js` — xlsx → CSV 변환
3. `node scripts/extract-js-data.js` — (레거시 JS 데이터 → CSV, 최초 마이그레이션 시에만)
4. `node scripts/clean-csv.js` — 빈 행 제거

### 새 테이블 페이지 추가
1. `datas/` 에 CSV 파일 추가
2. `scripts/gen-table-pages.js`의 `PAGES` 배열에 항목 추가 후 실행, 또는 기존 테이블 HTML을 복사하여 CSV 경로/제목만 변경
3. `js/common.js`의 `MENU` 배열에 항목 추가

## Language

UI 텍스트와 주석은 한국어로 작성한다.
