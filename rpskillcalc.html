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

function findTotalColumn(table) {
  if (!table?.headers) return null;
  return table.headers.find(h => h.includes("누적")) || null;
}

function getCumulativeValue(tableKey, level) {
  if (!level || level <= 0) return 0;

  const table = skillTables[tableKey];
  if (!table?.rows) return 0;

  const totalColumn = findTotalColumn(table);
  if (!totalColumn) return 0;

  const row = table.rows.find(r => Number(r["레벨"]) === Number(level));
  if (!row) return 0;

  return Number(row[totalColumn]) || 0;
}

function calcSkillRP(tableKey, currentLv, targetLv) {
  const current = Number(currentLv) || 0;
  const target = Number(targetLv) || 0;

  if (target <= current) return 0;

  const currentTotal = getCumulativeValue(tableKey, current);
  const targetTotal = getCumulativeValue(tableKey, target);

  return Math.max(0, targetTotal - currentTotal);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function renderTable() {
  const tbody = document.querySelector("#rpSkillTable tbody");
  tbody.innerHTML = skills.map(skill => `
    <tr data-table-key="${skill.tableKey}">
      <td class="skill-name">${skill.name}</td>
      <td>
        <input class="current-lv" type="number" min="0" max="${skill.max}" value="0">
      </td>
      <td>
        <input class="target-lv" type="number" min="0" max="${skill.max}" value="${skill.max}">
      </td>
      <td class="need-rp">0</td>
    </tr>
  `).join("");
}

function recalcAll() {
  const rows = document.querySelectorAll("#rpSkillTable tbody tr");
  let total = 0;

  rows.forEach(tr => {
    const tableKey = tr.dataset.tableKey;
    const currentLv = tr.querySelector(".current-lv").value;
    const targetLv = tr.querySelector(".target-lv").value;
    const need = calcSkillRP(tableKey, currentLv, targetLv);

    tr.querySelector(".need-rp").textContent = formatNumber(need);
    total += need;
  });

  document.querySelector(".grand-total").textContent = formatNumber(total);
}

document.addEventListener("DOMContentLoaded", () => {
  renderTable();
  recalcAll();

  document.querySelector("#rpSkillTable").addEventListener("input", () => {
    recalcAll();
  });
});
