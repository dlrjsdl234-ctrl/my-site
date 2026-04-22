/**
 * 경험치 계산 로직
 * datas/exp.csv에서 데이터를 로딩하여 레벨업 시간 계산
 */
import { loadCSV } from "../csv-loader.js";

let expNeed = [0];
let expTotal = [0];
let loaded = false;

export async function initExpData(basePath) {
  if (loaded) return;
  const rows = await loadCSV(basePath + "/datas/exp.csv");

  expNeed = [0];
  expTotal = [0];
  let sum = 0;

  for (const row of rows) {
    const lv = Number(row.level);
    const exp = Number(String(row.expNeed).replace(/,/g, ""));
    expNeed[lv] = exp;
    sum += exp;
    expTotal[lv] = sum;
  }

  loaded = true;
}

export function getRequiredExpBetweenLevels(currentLv, targetLv) {
  currentLv = Number(currentLv);
  targetLv = Number(targetLv);

  if (!Number.isInteger(currentLv) || !Number.isInteger(targetLv)) {
    return { error: "레벨은 정수로 입력하세요." };
  }

  if (currentLv < 1 || targetLv < 1) {
    return { error: "레벨은 1 이상이어야 합니다." };
  }

  if (currentLv >= targetLv) {
    return { error: "목표 레벨은 현재 레벨보다 커야 합니다." };
  }

  if (targetLv - 1 >= expTotal.length) {
    return { error: "목표 레벨 데이터가 없습니다." };
  }

  const currentTotal = expTotal[currentLv - 1] || 0;
  const targetTotal = expTotal[targetLv - 1] || 0;

  return { currentLv, targetLv, requiredExp: targetTotal - currentTotal };
}

export function calculateLevelUpTime(currentLv, targetLv, expPerMinute, hourglassLv) {
  expPerMinute = Number(expPerMinute);
  hourglassLv = Number(hourglassLv);

  if (!Number.isFinite(expPerMinute) || !Number.isFinite(hourglassLv)) {
    return { error: "경험치와 모래시계 레벨은 숫자로 입력하세요." };
  }

  if (expPerMinute <= 0) {
    return { error: "1분당 경험치는 0보다 커야 합니다." };
  }

  if (!Number.isInteger(hourglassLv) || hourglassLv < 0 || hourglassLv > 20) {
    return { error: "모래시계 레벨은 0~20 사이의 정수여야 합니다." };
  }

  const expInfo = getRequiredExpBetweenLevels(currentLv, targetLv);
  if (expInfo.error) return expInfo;

  const multiplier = 1 + (hourglassLv * 0.1);
  const adjustedRequiredExp = expInfo.requiredExp * multiplier;
  const totalMinutes = adjustedRequiredExp / expPerMinute;
  const totalHours = totalMinutes / 60;
  const totalDays = totalMinutes / 1440;

  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = Math.round(totalMinutes % 60);

  return {
    currentLv: expInfo.currentLv,
    targetLv: expInfo.targetLv,
    baseRequiredExp: expInfo.requiredExp,
    multiplier,
    requiredExp: adjustedRequiredExp,
    totalMinutes,
    totalHours,
    totalDays,
    days,
    hours,
    minutes
  };
}

/**
 * 사이클 최적화 계산
 * LV 1에서 시작하여 주어진 시간 동안 사냥 + 소탕으로 도달 가능한 최고 레벨 산출
 *
 * @param {number} expPerMinute - 1분당 경험치
 * @param {number} hourglassLv - 모래시계 레벨 (0~20)
 * @param {number} sweepExp - 소탕 1회당 경험치
 * @param {number} sweepCount - 소탕 횟수 (1~3)
 * @param {number} totalHours - 총 시간 (시간 단위)
 */
export function calculateCycleLevel(expPerMinute, hourglassLv, sweepExp, sweepCount, totalHours) {
  expPerMinute = Number(expPerMinute);
  hourglassLv = Number(hourglassLv);
  sweepExp = Number(sweepExp);
  sweepCount = Number(sweepCount);
  totalHours = Number(totalHours);

  if (!Number.isFinite(expPerMinute) || expPerMinute <= 0) {
    return { error: "1분당 경험치는 0보다 커야 합니다." };
  }
  if (!Number.isInteger(hourglassLv) || hourglassLv < 0 || hourglassLv > 20) {
    return { error: "모래시계 레벨은 0~20 사이의 정수여야 합니다." };
  }
  if (!Number.isFinite(sweepExp) || sweepExp < 0) {
    return { error: "소탕 경험치는 0 이상이어야 합니다." };
  }
  if (!Number.isInteger(sweepCount) || sweepCount < 1 || sweepCount > 3) {
    return { error: "소탕 횟수는 1~3 사이의 정수여야 합니다." };
  }
  if (!Number.isFinite(totalHours) || totalHours <= 0) {
    return { error: "총 시간은 0보다 커야 합니다." };
  }

  const multiplier = 1 + (hourglassLv * 0.1);

  // 모래시계는 획득 경험치가 아니라 필요 경험치 쪽에 적용
  const totalHuntingExp = expPerMinute * totalHours * 60;

  const sweepSets = Math.max(1, Math.floor(totalHours / 24));
  const totalSweepExp = sweepExp * sweepCount * sweepSets;
  const grandTotalExp = totalHuntingExp + totalSweepExp;

  // LV 1에서 시작하여 도달 가능한 최고 레벨 탐색
  let cycleLevel = 1;
  for (let lv = 1; lv < expTotal.length; lv++) {
    if ((expTotal[lv] * multiplier) <= grandTotalExp) {
      cycleLevel = lv + 1;
    } else {
      break;
    }
  }

  return {
    cycleLevel,
    grandTotalExp,
    totalHuntingExp,
    totalSweepExp,
    multiplier,
    sweepSets
  };
}
