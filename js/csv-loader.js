/**
 * csv-loader.js
 * CSV 파일을 fetch하여 객체 배열로 반환
 */

/**
 * CSV 문자열을 파싱하여 객체 배열로 반환
 * @param {string} text - CSV 텍스트
 * @returns {Array<Object>} 헤더를 키로 하는 객체 배열
 */
export function parseCSV(text) {
  const lines = text.split("\n").filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    // 모든 값이 빈 문자열이면 건너뜀
    if (values.every(v => v.trim() === "")) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j].trim() : "";
    }
    rows.push(obj);
  }

  return rows;
}

/**
 * CSV 한 줄을 파싱 (쉼표, 따옴표 처리)
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

/**
 * CSV 파일을 fetch하여 객체 배열로 반환
 * @param {string} url - CSV 파일 경로
 * @returns {Promise<Array<Object>>}
 */
export async function loadCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV 로딩 실패: ${url} (${res.status})`);
  const text = await res.text();
  return parseCSV(text);
}
