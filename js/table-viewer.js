/**
 * table-viewer.js
 * 범용 CSV 테이블 렌더러 (정렬, 검색 기능)
 */
import { loadCSV } from "./csv-loader.js";

/**
 * CSV 데이터를 테이블로 렌더링
 * @param {string} csvPath - CSV 파일 경로
 * @param {string} containerId - 테이블을 넣을 컨테이너 ID
 * @param {Object} [options]
 * @param {boolean} [options.search=true] - 검색 필터 표시 여부
 * @param {boolean} [options.sortable=true] - 컬럼 정렬 기능
 */
export async function renderTable(csvPath, containerId, options = {}) {
  const { search = true, sortable = true, levelFilter = false } = options;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "데이터 로딩 중...";

  let rows;
  try {
    rows = await loadCSV(csvPath);
  } catch (e) {
    container.innerHTML = `<p style="color:red">데이터 로딩 실패: ${e.message}</p>`;
    return;
  }

  if (rows.length === 0) {
    container.innerHTML = "<p>데이터가 없습니다.</p>";
    return;
  }

  const headers = Object.keys(rows[0]);

  // 빈 컬럼 필터링 (모든 행이 빈 문자열인 컬럼 제거)
  const activeHeaders = headers.filter(h =>
    rows.some(row => row[h] !== undefined && row[h] !== "")
  );

  let filteredRows = rows;
  let sortCol = null;
  let sortAsc = true;

  // 컨테이너 구성
  container.innerHTML = "";

  // 검색 입력
  let searchInput = null;
  if (search) {
    searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "검색...";
    searchInput.className = "table-search";
    searchInput.addEventListener("input", () => {
      applyFilter();
      render();
    });
    container.appendChild(searchInput);
  }

  // 레벨 필터 입력
  let levelInput = null;
  if (levelFilter) {
    levelInput = document.createElement("input");
    levelInput.type = "number";
    levelInput.placeholder = "레벨 입력...";
    levelInput.className = "table-search";
    levelInput.min = "1";
    levelInput.addEventListener("input", () => {
      applyFilter();
      render();
    });
    container.appendChild(levelInput);
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-container";
  container.appendChild(tableWrap);

  const infoEl = document.createElement("div");
  infoEl.className = "table-info";
  container.appendChild(infoEl);

  function applyFilter() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const levelVal = levelInput ? levelInput.value.trim() : "";

    filteredRows = rows;

    if (query) {
      filteredRows = filteredRows.filter(row =>
        activeHeaders.some(h => String(row[h]).toLowerCase().includes(query))
      );
    }

    if (levelVal) {
      const lv = Number(levelVal);
      if (Number.isFinite(lv)) {
        // 첫 번째 컬럼(레벨)에서 숫자 매칭
        const lvCol = activeHeaders[0];
        filteredRows = filteredRows.filter(row => {
          const rowLv = Number(String(row[lvCol] || "").replace(/,/g, "").trim());
          return rowLv === lv;
        });
      }
    }
  }

  function applySort() {
    if (!sortCol) return;
    filteredRows.sort((a, b) => {
      let va = a[sortCol] || "";
      let vb = b[sortCol] || "";

      // 숫자 비교 시도
      const na = parseNumber(va);
      const nb = parseNumber(vb);
      if (na !== null && nb !== null) {
        return sortAsc ? na - nb : nb - na;
      }

      // 문자열 비교
      va = va.toLowerCase();
      vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  function parseNumber(str) {
    if (str === "" || str === undefined) return null;
    const cleaned = String(str).replace(/,/g, "").trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  function render() {
    applySort();

    let html = '<table class="data-table"><thead><tr>';

    for (const h of activeHeaders) {
      let sortIcon = "";
      if (sortable) {
        if (sortCol === h) {
          sortIcon = `<span class="sort-icon active">${sortAsc ? "▲" : "▼"}</span>`;
        } else {
          sortIcon = '<span class="sort-icon">△</span>';
        }
      }
      html += `<th data-col="${h}">${h}${sortIcon}</th>`;
    }

    html += "</tr></thead><tbody>";

    for (const row of filteredRows) {
      html += "<tr>";
      for (const h of activeHeaders) {
        html += `<td>${escapeHtml(row[h] || "")}</td>`;
      }
      html += "</tr>";
    }

    html += "</tbody></table>";
    tableWrap.innerHTML = html;
    infoEl.textContent = `총 ${filteredRows.length}행 / 전체 ${rows.length}행`;

    // 정렬 이벤트
    if (sortable) {
      tableWrap.querySelectorAll("th").forEach(th => {
        th.addEventListener("click", () => {
          const col = th.dataset.col;
          if (sortCol === col) {
            sortAsc = !sortAsc;
          } else {
            sortCol = col;
            sortAsc = true;
          }
          render();
        });
      });
    }
  }

  render();
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
