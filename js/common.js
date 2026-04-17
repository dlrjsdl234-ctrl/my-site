/**
 * common.js
 * 사이드바 동적 생성 + 네비게이션 + 공통 유틸
 */

// ==============================
// 메뉴 정의
// ==============================

const MENU = [
  { section: "홈" },
  { label: "홈", href: "/index.html" },

  { section: "계산기" },
  { label: "환포 계산기", href: "/pages/calc/rpMachine.html" },
  { label: "경험치 계산기", href: "/pages/calc/exp.html" },
  { label: "유물 계산기", href: "/pages/calc/artifact.html" },
  { label: "RP 스킬 계산기", href: "/pages/calc/rpskill.html" },

  { section: "테이블" },
  { label: "초월정보", href: "/pages/tables/transcend.html" },
  { label: "몬스터체경비", href: "/pages/tables/monster-stat.html" },
  { label: "잡팁", href: "/pages/tables/tips.html" },
  { label: "RP스킬 투자순서", href: "/pages/tables/rpskill-order.html" },
  { label: "몬스터 디펜스", href: "/pages/tables/town-defense.html" },
  { label: "SP 스킬", href: "/pages/tables/sp-skill.html" },
  { label: "RP 스킬", href: "/pages/tables/rpskill-perf.html" },
  { label: "유물", href: "/pages/tables/artifact-info.html" },
  { label: "환포표", href: "/pages/tables/hanpo.html" },
  { label: "이세계스킬", href: "/pages/tables/isekai-perf.html" },
];

// ==============================
// 기본 경로 계산
// ==============================

function getBasePath() {
  const path = location.pathname;
  // /index.html 또는 / → 루트
  if (path === "/" || path.endsWith("/index.html") || path === "/index.html") {
    return ".";
  }
  // /pages/calc/*.html 또는 /pages/tables/*.html → 2단계 위
  if (path.includes("/pages/")) {
    return "../..";
  }
  // 기본
  return ".";
}

// ==============================
// 사이드바 생성
// ==============================

function buildSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const basePath = getBasePath();
  const currentPath = location.pathname;

  let html = '<div class="logo">이류월드 계산기</div>\n<ul class="menu">\n';

  for (const item of MENU) {
    if (item.section) {
      html += `  <li class="menu-section">${item.section}</li>\n`;
      continue;
    }
  
    const href = basePath + item.href;

    const isActive = currentPath.endsWith(item.href) ||
      (item.href === "/index.html" && (currentPath === "/" || currentPath.endsWith("/") || currentPath.endsWith("/index.html")));
    const activeClass = isActive ? ' class="active"' : "";
  
    html += `  <li><a href="${href}"${activeClass}>${item.label}</a></li>\n`;
  }

  html += "</ul>";
  sidebar.innerHTML = html;
}

// ==============================
// 초기화
// ==============================

document.addEventListener("DOMContentLoaded", () => {
  buildSidebar();
});
