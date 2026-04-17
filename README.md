# 이류월드 계산기

모바일 게임 **이류월드**(이세계에선 내가 1억 과금러!?)의 각종 게임 데이터 계산기 모음 사이트입니다.

빌드 도구 없이 순수 HTML/CSS/JavaScript(ES modules)로 구성된 정적 사이트이며, GitHub Pages로 배포됩니다.

## 주요 기능

### 계산기
- **환포 계산기** — 환포 달성에 필요한 레벨 계산 (배율 스택 적용)
- **경험치 계산기** — 목표 레벨까지 소요 시간 계산
- **유물 계산기** — 수호석 균등 분배 최적화
- **RP 스킬 계산기** — 스킬 레벨업에 필요한 RP 계산

### 테이블
- 초월정보, 몬스터 스탯, RP 스킬, SP 스킬, 유물, 환포표, 이세계 스킬 등 게임 데이터 열람

## 로컬 개발

ES module을 사용하므로 반드시 HTTP 서버가 필요합니다.

```bash
npx serve .
```

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
