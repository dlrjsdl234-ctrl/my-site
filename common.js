/**
 * common.js
 * 페이지 이동 + 공통 UI
 */

// ==============================
// 공통 함수
// ==============================

function fnalert(value) {
  alert(value);
}

// ==============================
// 페이지 이동
// ==============================

// RP 계산기
function fnMachine() {
  window.location.href = "rpMachine.html";
}

// 경험치 계산기
function fnExpPage() {
  window.location.href = "expCalc.html";
}

// 유물 계산기
function fnArtifactPage() {
  window.location.href = "artifactCalc.html";
}

// RP 스킬 계산기
function fnRPSkillPage() {
  window.location.href = "rpskillcalc.html";
}

// ==============================
// 메뉴 활성화 처리
// ==============================

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
