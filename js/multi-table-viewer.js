/**
 * multi-table-viewer.js
 * meta.csv 기반 드롭다운 선택 뷰어
 * 디렉토리 내 meta.csv에서 항목 목록을 읽고, 드롭다운으로 선택하면 해당 CSV를 로딩/표시
 */
import { loadCSV } from "./csv-loader.js";

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 드롭다운 기반 멀티 테이블 렌더링
 * @param {string} dirPath - meta.csv가 있는 디렉토리 경로 (예: "../../datas/sp-skill")
 * @param {string} containerId - 컨테이너 ID
 */
export async function renderMultiTable(dirPath, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "데이터 로딩 중...";

  let meta;
  try {
    meta = await loadCSV(dirPath + "/meta.csv");
  } catch (e) {
    container.innerHTML = `<p style="color:red">메타 데이터 로딩 실패: ${e.message}</p>`;
    return;
  }

  if (meta.length === 0) {
    container.innerHTML = "<p>데이터가 없습니다.</p>";
    return;
  }

  // UI 구성
  container.innerHTML = "";

  // 드롭다운
  const selectWrap = document.createElement("div");
  selectWrap.style.marginBottom = "16px";

  const select = document.createElement("select");
  select.className = "table-dropdown";

  for (const item of meta) {
    const opt = document.createElement("option");
    opt.value = item.file;
    opt.textContent = item.name;
    select.appendChild(opt);
  }

  selectWrap.appendChild(select);
  container.appendChild(selectWrap);

  // 테이블 영역
  const tableArea = document.createElement("div");
  tableArea.id = containerId + "_table";
  container.appendChild(tableArea);

  // 선택 변경 시 로딩
  async function loadSelected() {
    const file = select.value;
    tableArea.innerHTML = "로딩 중...";

    try {
      const rows = await loadCSV(dirPath + "/" + file);
      if (rows.length === 0) {
        tableArea.innerHTML = "<p>데이터가 없습니다.</p>";
        return;
      }

      const headers = Object.keys(rows[0]);
      // 빈 컬럼 필터
      const activeHeaders = headers.filter(h =>
        rows.some(row => row[h] !== undefined && row[h] !== "")
      );

      let html = '<div class="table-container"><table class="data-table"><thead><tr>';
      for (const h of activeHeaders) {
        html += `<th>${escapeHtml(h)}</th>`;
      }
      html += "</tr></thead><tbody>";

      for (const row of rows) {
        html += "<tr>";
        for (const h of activeHeaders) {
          html += `<td>${escapeHtml(row[h] || "")}</td>`;
        }
        html += "</tr>";
      }

      html += "</tbody></table></div>";
      html += `<div class="table-info">${rows.length}행</div>`;
      tableArea.innerHTML = html;
    } catch (e) {
      tableArea.innerHTML = `<p style="color:red">로딩 실패: ${e.message}</p>`;
    }
  }

  select.addEventListener("change", loadSelected);
  loadSelected(); // 첫 번째 항목 자동 로딩
}
