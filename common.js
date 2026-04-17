/**
 * common.js
 * 기본 JavaScript 템플릿
 * Author: Your Name
 * Description: 간단한 구조 + 유틸 함수 + 실행 예제
 */

// ==============================
// 실행 (Entry Point)
// ==============================

function fnalert(value) {
  alert(value);
}

// RP계산기 이동
function fnMachine() {
  window.location.href = "rpMachine.html";
}

// 경험치 계산기 이동
function fnExpPage() {
  window.location.href = "expCalc.html";
}

// 유물 계산기 이동
function fnArtifactPage() {
  window.location.href = "artifactCalc.html";
}

// RP 스킬 계산기 이동
function fnRPSkillPage() {
  window.location.href = "rpskillcalc.html";
}

function fnExpCalc() {
  const level = Number(prompt("현재 레벨을 입력하세요:"));
  const exp = Number(prompt("현재 경험치를 입력하세요:"));

  if (isNaN(level) || isNaN(exp)) {
    alert("숫자를 입력하세요!");
    return;
  }

  const info = getLevelInfoByLv(level, exp);

  if (!info || info.error) {
    alert(info?.error || "잘못된 입력");
    return;
  }

  alert(
    `레벨: ${info.level}\n` +
    `경험치: ${info.currentExp} / ${info.maxExp}\n` +
    `진행률: ${info.progressPercent}%\n` +
    `남은 경험치: ${info.remainExp}`
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = location.pathname.split("/").pop();
  const menuLinks = document.querySelectorAll(".menu a");

  menuLinks.forEach(link => {
    const linkPage = link.getAttribute("href");

    if (linkPage === currentPage || (currentPage === "" && linkPage === "index.html")) {
      link.classList.add("active");
    }
  });
});
