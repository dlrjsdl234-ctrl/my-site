/**
 * multi-table-viewer.js
 * xlsx에서 옆으로 나란히 배치된 서브테이블이 포함된 CSV를 파싱하여
 * 개별 테이블로 분리하여 렌더링
 *
 * 패턴: 빈 컬럼(,,)을 구분자로 서브테이블이 옆으로 나열됨
 * 예: 스킬A,LV,비용,성능,,스킬B,LV,비용,성능,,
 */
import { loadCSV, parseCSV } from "./csv-loader.js";

/**
 * 수평 CSV를 서브테이블로 분리
 * @param {string} csvText - 원본 CSV 텍스트
 * @returns {Array<{title: string, headers: string[], rows: Array<string[]>}>}
 */
function splitHorizontalCSV(csvText) {
  const lines = csvText.split("\n").filter(l => l.trim() !== "");
  if (lines.length < 2) return [];

  // 모든 행을 파싱
  const allRows = lines.map(line => parseLine(line));

  // 헤더 행에서 빈 컬럼 위치를 찾아 서브테이블 경계 결정
  const headerRow = allRows[0];
  const groups = findColumnGroups(headerRow);

  const tables = [];

  for (const group of groups) {
    const { start, end } = group;

    // 서브테이블 제목 (헤더 행의 첫 번째 셀)
    const title = (headerRow[start] || "").trim();
    if (!title) continue;

    // 2번째 행이 실제 컬럼 헤더인지 확인
    // (1행: 스킬명, 2행: 레벨/비용/성능 같은 컬럼명, 3행~: 데이터)
    // 또는 (1행: 스킬명+컬럼명이 같은 행)
    let colHeaders;
    let dataStartRow;

    // 두 번째 행의 이 그룹 부분이 컬럼 헤더처럼 보이는지 확인
    if (allRows.length > 1) {
      const secondRow = allRows[1];
      const secondFirstCell = (secondRow[start] || "").trim();
      // 두 번째 행의 첫 셀이 "레벨", "LV", 숫자가 아닌 텍스트면 컬럼 헤더로 판단
      if (secondFirstCell && isNaN(Number(secondFirstCell.replace(/[LV,\s]/g, ""))) &&
          !secondFirstCell.match(/^\d+LV$/)) {
        colHeaders = [];
        for (let c = start; c <= end; c++) {
          colHeaders.push((secondRow[c] || "").trim());
        }
        dataStartRow = 2;
      } else {
        // 헤더 행 자체가 컬럼명을 포함
        colHeaders = [];
        for (let c = start; c <= end; c++) {
          colHeaders.push((headerRow[c] || "").trim());
        }
        dataStartRow = 1;
      }
    } else {
      continue;
    }

    // 데이터 행 추출
    const rows = [];
    for (let r = dataStartRow; r < allRows.length; r++) {
      const row = allRows[r];
      const values = [];
      let hasData = false;

      for (let c = start; c <= end; c++) {
        const val = (row[c] || "").trim();
        values.push(val);
        if (val !== "") hasData = true;
      }

      if (hasData) {
        rows.push(values);
      }
    }

    if (rows.length > 0) {
      tables.push({ title, headers: colHeaders, rows });
    }
  }

  return tables;
}

/**
 * 컬럼 그룹 찾기: 빈 컬럼을 구분자로 사용
 */
function findColumnGroups(headerRow) {
  const groups = [];
  let start = null;

  for (let i = 0; i < headerRow.length; i++) {
    const val = (headerRow[i] || "").trim();

    if (val !== "") {
      if (start === null) start = i;
    } else {
      if (start !== null) {
        groups.push({ start, end: i - 1 });
        start = null;
      }
    }
  }

  // 마지막 그룹
  if (start !== null) {
    groups.push({ start, end: headerRow.length - 1 });
  }

  // 후행 빈 컬럼 제거
  for (const g of groups) {
    while (g.end > g.start && (headerRow[g.end] || "").trim() === "") {
      g.end--;
    }
  }

  return groups;
}

/**
 * CSV 한 줄 파싱 (csv-loader.js와 동일 로직)
 */
function parseLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * 수평 CSV를 로딩하여 여러 서브테이블로 렌더링
 * @param {string} csvPath - CSV 파일 경로
 * @param {string} containerId - 컨테이너 ID
 */
export async function renderMultiTable(csvPath, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "데이터 로딩 중...";

  let csvText;
  try {
    const res = await fetch(csvPath);
    if (!res.ok) throw new Error(`${res.status}`);
    csvText = await res.text();
  } catch (e) {
    container.innerHTML = `<p style="color:red">데이터 로딩 실패: ${e.message}</p>`;
    return;
  }

  const tables = splitHorizontalCSV(csvText);

  if (tables.length === 0) {
    container.innerHTML = "<p>데이터가 없습니다.</p>";
    return;
  }

  let html = "";

  for (const table of tables) {
    html += `<div class="multi-table-section">`;
    html += `<h3 class="multi-table-title">${escapeHtml(table.title)}</h3>`;
    html += `<div class="table-container"><table class="data-table"><thead><tr>`;

    for (const h of table.headers) {
      html += `<th>${escapeHtml(h)}</th>`;
    }

    html += `</tr></thead><tbody>`;

    for (const row of table.rows) {
      html += "<tr>";
      for (const cell of row) {
        html += `<td>${escapeHtml(cell)}</td>`;
      }
      html += "</tr>";
    }

    html += `</tbody></table></div></div>`;
  }

  container.innerHTML = html;
}
