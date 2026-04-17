import skillTables from "./rpskill.js";

const skills = [
  { name: "부스트", max: 2, tableKey: "table1" },
  { name: "경험치", max: 200, tableKey: "table2" },
  { name: "강화 확률 증가", max: 10, tableKey: "table3" },
  { name: "SP 증가량", max: 1200, tableKey: "table4" },
  { name: "장비 제한 레벨 감소", max: 24, tableKey: "table5" },
  { name: "샤프", max: 55, tableKey: "table6" },
  { name: "버서크", max: 55, tableKey: "table7" },
  { name: "쉐도우 파트너", max: 55, tableKey: "table8" },
  { name: "환포", max: 40, tableKey: "table9" },
  { name: "비홀더버프", max: 4, tableKey: "table10" },
  { name: "타겟", max: 1, tableKey: "table11" },
  { name: "강화횟수", max: 1, tableKey: "table12" },
  { name: "메용", max: 40, tableKey: "table13" },
  { name: "원거리마스터리", max: 25, tableKey: "table14" },
  { name: "어드밴스드 콤보어택", max: 55, tableKey: "table15" },
  { name: "파이널어택", max: 10, tableKey: "table16" },
  { name: "너클마스터리", max: 25, tableKey: "table17" },
  { name: "크리티컬 리인포스", max: 40, tableKey: "table18" },
  { name: "오브마스터리", max: 30, tableKey: "table19" },
  { name: "아드레날린 부스터", max: 20, tableKey: "table20" }
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function findLevelColumn(table) {
  if (!table?.headers?.length) return null;
  return table.headers.find((h) => String(h).trim() === "레벨") || table.headers[0];
}

function findTotalColumn(table) {
  if (!table?.headers?.length) return null;

  const priority = ["누적 RP", "누적 포인트", "누적 SP"];
  for (const key of priority) {
    if (table.headers.includes(key)) return key;
  }

  return table.headers.find((h) => String(h).includes("누적")) || null;
}

function getRowByLevel(table, level) {
  if (!table?.rows?.length) return null;

  const levelColumn = findLevelColumn(table);
  if (!levelColumn) return null;

  return table.rows.find((row) => Number(row[levelColumn]) === Number(level)) || null;
}

function getCumulativeValue(tableKey, level) {
  if (!level || level <= 0) return 0;

  const table = skillTables[tableKey];
  if (!table) return 0;

  const totalColumn = findTotalColumn(table);
  if (!totalColumn) return 0;

  const row = getRowByLevel(table, level);
  if (!row) return 0;

  return Number(row[totalColumn]) || 0;
}

function calcSkillRP(tableKey, currentLv, targetLv, maxLv) {
  const current = clamp(Number(currentLv) || 0, 0, maxLv);
  const target = clamp(Number(targetLv) || 0, 0, maxLv);

  if (target <= current) return 0;

  const currentTotal = getCumulativeValue(tableKey, current);
  const targetTotal = getCumulativeValue(tableKey, target);

  return Math.max(0, targetTotal - currentTotal);
}

function renderTable() {
  const tbody = document.querySelector("#rpSkillTable tbody");
  if (!tbody) return;

  tbody.innerHTML = skills.map((skill) => `
    <tr data-table-key="${skill.tableKey}" data-max="${skill.max}">
      <td class="skill-name">${skill.name} 최대 ${skill.max}</td>
      <td>
        <input
          class="current-lv"
          type="number"
          min="0"
          max="${skill.max}"
          value="0"
        >
      </td>
      <td>
        <input
          class="target-lv"
          type="number"
          min="0"
          max="${skill.max}"
          value="0"
        >
      </td>
      <td class="need-rp highlight">0</td>
    </tr>
  `).join("");
}

function normalizeRowInputs(tr) {
  const max = Number(tr.dataset.max) || 0;
  const currentInput = tr.querySelector(".current-lv");
  const targetInput = tr.querySelector(".target-lv");

  let current = Number(currentInput.value) || 0;
  let target = Number(targetInput.value) || 0;

  current = clamp(current, 0, max);
  target = clamp(target, 0, max);

  currentInput.value = current;
  targetInput.value = target;

  return { current, target, max };
}

function recalcRow(tr) {
  const tableKey = tr.dataset.tableKey;
  const resultCell = tr.querySelector(".need-rp");
  const { current, target, max } = normalizeRowInputs(tr);

  const needRP = calcSkillRP(tableKey, current, target, max);
  resultCell.textContent = formatNumber(needRP);

  return needRP;
}

function recalcAll() {
  const rows = document.querySelectorAll("#rpSkillTable tbody tr");
  let total = 0;

  rows.forEach((tr) => {
    total += recalcRow(tr);
  });

  const totalCell = document.querySelector(".grand-total");
  if (totalCell) {
    totalCell.textContent = formatNumber(total);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderTable();
  recalcAll();

  const table = document.getElementById("rpSkillTable");
  if (!table) return;

  table.addEventListener("input", (e) => {
    if (
      e.target.classList.contains("current-lv") ||
      e.target.classList.contains("target-lv")
    ) {
      recalcAll();
    }
  });

  table.addEventListener("change", (e) => {
    if (
      e.target.classList.contains("current-lv") ||
      e.target.classList.contains("target-lv")
    ) {
      recalcAll();
    }
  });
});
