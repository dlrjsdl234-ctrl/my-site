# Cloudflare Pages 배포

기존 vercel.json은 Vercel용으로 유지한다. Cloudflare Pages는
functions/api/[[path]].js로 /api/* 요청을 기존 봇 서버에 전달한다.
_routes.json은 API만 Functions를 호출하도록 제한한다.
HTML, CSS, JS, CSV, OCR 파일은 정적 파일로 제공한다.

## Git 연동 배포 설정

- 서비스: Cloudflare Pages (Workers 프로젝트가 아닌 Pages 프로젝트)
- 프레임워크: None
- 프로젝트 루트: 이 저장소 루트
- 빌드 명령: 비워 둠
- 빌드 출력 디렉터리: .

functions 디렉터리를 포함해 Git에 반영한 뒤 Pages의 Git 연동으로 배포한다.
대시보드의 정적 파일 드래그 앤 드롭 대신 Git 연동을 사용한다.

## Discord 봇 설정 확인

API 대상은 https://iryu-discord-bot.vercel.app 이다.
GET/POST, 쿼리 문자열, 요청 본문, Cookie 헤더와 응답 Set-Cookie를 전달한다.
OAuth 리다이렉트는 그대로 브라우저로 전달한다.

봇에서 로그인 완료 후 돌아갈 URL을 새 Pages 주소 또는 실제 사용할 도메인으로
설정해야 한다. OAuth callback 주소도 변경하는 구조라면 Discord Developer Portal의
등록 주소와 봇 환경변수를 함께 맞춘다. 쿠키 Domain이 기존 사이트에 고정되어
있다면 새 도메인에 맞게 수정해야 한다. 이 저장소만으로 봇 설정은 변경되지 않는다.

## 배포 후 확인

1. 홈과 계산기, CSV 표, OCR 파일이 정상 로드되는지 확인한다.
2. /api/me가 HTML 대신 봇의 JSON 응답을 반환하는지 확인한다.
   로그인 전 401은 정상이다.
3. Discord 인증 후 새 사이트로 돌아오고 /api/me가 200인지 확인한다.
4. 인증된 계정으로 Discord DM 알림을 확인한다.
