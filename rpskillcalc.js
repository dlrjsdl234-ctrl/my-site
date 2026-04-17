import skillTables from "./rpskill.js";

const skillMap = {
  "부스트": "table1",
  "경험치": "table2",
  "강화 확률 증가": "table3",
  "SP 증가량": "table4",
  "장비 제한 레벨 감소": "table5",
  "샤프": "table6",
  "버서크": "table7",
  "쉐도우 파트너": "table8",
  "환포": "table9",
  "비홀더버프": "table10",
  "타겟": "table11",
  "강화횟수": "table12",
  "메용": "table13",
  "원거리마스터리": "table14",
  "어드밴스드 콤보어택": "table15",
  "파이널어택": "table16",
  "너클마스터리": "table17",
  "크리티컬 리인포스": "table18",
  "오브마스터리": "table19",
  "아드레날린 부스터": "table20"
};

function findTotalColumn(table) {
  if (!table || !table.headers) return null;

  const priority = [
    "누적 RP",
    "누적 포인트",
    "누적 SP"
  ];

  for (const key of priority) {
    if (table.headers.includes(key)) return key;
  }

  return table.headers.find(h => h.includes("누적")) || null;
}

function getCumulativeValue(tableKey, level) {
  const table = skillTables[tableKey];
  if (!table || !table.rows || level <= 0) return 0;

  const totalColumn = findTotalColumn(table);
  if (!totalColumn) return 0;

  const row = table.rows.find(r => Number(r["레벨"]) === Number(level));
  if (!row) return 0;

  return Number(row[totalColumn]) || 0;
}

export function calcSkillRP(skillName, currentLv, targetLv) {
  const tableKey = skillMap[skillName];
  if (!tableKey) return 0;

  const current = Number(currentLv) || 0;
  const target = Number(targetLv) || 0;

  if (target <= current) return 0;

  const currentTotal = getCumulativeValue(tableKey, current);
  const targetTotal = getCumulativeValue(tableKey, target);

  return Math.max(0, targetTotal - currentTotal);
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

export function recalcSkillTable(tableSelector) {
  const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
  let grandTotal = 0;

  rows.forEach((tr) => {
    const skillName = tr.querySelector(".skill-name")?.textContent.trim() || "";
    const currentLv = tr.querySelector(".current-lv")?.value || 0;
    const targetLv = tr.querySelector(".target-lv")?.value || 0;
    const resultCell = tr.querySelector(".need-rp");

    const needRP = calcSkillRP(skillName, currentLv, targetLv);

    if (resultCell) {
      resultCell.textContent = formatNumber(needRP);
    }

    grandTotal += needRP;
  });

  const totalCell = document.querySelector(".grand-total");
  if (totalCell) {
    totalCell.textContent = formatNumber(grandTotal);
  }
}