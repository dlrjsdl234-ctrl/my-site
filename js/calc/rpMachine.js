/**
 * 환포 계산기 로직
 * datas/hanpo-table.csv에서 레벨별 환포 데이터 로딩
 */
import { loadCSV } from "../csv-loader.js";

let hanpoData = []; // { level, hanpo }
let loaded = false;

// 초월 배율 테이블
const TRANSCEND_MULTIPLIER = {
  0: 1,
  1: 1,
  2: 1.1,
  3: 1.15,
  4: 1.3,
  5: 1.4,
  6: 1.6,
  7: 1.8,
  8: 1,   // 미확인
  9: 1,   // 미확인
  10: 1   // 미확인
};

// 윤회 축복 배율
const REBIRTH_MULTIPLIER = {
  0: 1.05,
  1: 1.1,
  2: 1.2,
  3: 1.3,
  4: 1.45,
  5: 1.6,
  6: 2,
  7: 2.5,
};

// 모래시계 배율
function getHourglassMultiplier(level) {
  if (level <= 0) return 1;
  return 1 + level * 0.1;
}

export async function initHanpoData(basePath) {
  if (loaded) return;
  const rows = await loadCSV(basePath + "/datas/hanpo-table.csv");

  hanpoData = [];
  for (const row of rows) {
    const level = Number(row["레벨"]);
    const rawHanpo = String(row["환포"] || "").replace(/,/g, "").trim();
    const hanpo = Number(rawHanpo);
    if (Number.isFinite(level) && Number.isFinite(hanpo)) {
      hanpoData.push({ level, hanpo });
    }
  }

  hanpoData.sort((a, b) => a.level - b.level);
  loaded = true;
}

export function getTranscendMultiplier(level) {
  return TRANSCEND_MULTIPLIER[level] ?? 1;
}

export function getRebirthMultiplier(level) {
  return REBIRTH_MULTIPLIER[level] ?? 1;
}

/**
 * 주어진 기본 환포 이상을 제공하는 최소 레벨 찾기
 */
function findLevelForHanpo(targetBaseHanpo) {
  let result = null;
  for (const entry of hanpoData) {
    if (entry.hanpo >= targetBaseHanpo) {
      result = entry;
      break;
    }
  }
  return result;
}

/**
 * 특정 레벨의 환포 조회
 */
function getHanpoAtLevel(level) {
  const entry = hanpoData.find(e => e.level === level);
  return entry ? entry.hanpo : 0;
}

/**
 * 환포 계산
 * @param {Object} params
 * @param {number} params.targetHanpo - 원하는 환포 수치
 * @param {number} params.rpShopPercent - RP상점 환포 수치 (%)
 * @param {number} params.encyclopediaPercent - 도감 수치 (%)
 * @param {number} params.artifactRingPercent - 유물(반지) 수치 (%)
 * @param {number} params.vipPercent - VIP 수치 (%)
 * @param {number} params.transcendLevel - 초월 레벨 (0~10)
 * @param {number} params.hourglassLevel - 모래시계 레벨 (0~20)
 * @param {number} params.currentLevel - 내 현재 레벨
 */
export function calculateHanpo(params) {
  const {
    targetHanpo, rpShopPercent, encyclopediaPercent,
    artifactRingPercent, vipPercent,
    transcendLevel, hourglassLevel, currentLevel
  } = params;

  // 환포 배율 (D) = (100 + RP상점 + 도감 + 유물 + VIP) / 100
  const hanpoMultiplier = (100 + rpShopPercent + encyclopediaPercent + artifactRingPercent + vipPercent) / 100;

  // 초월 배율 (D1)
  const transcendMult = getTranscendMultiplier(transcendLevel);

  // 초월 환포 배율 (D2 = D * D1)
  const combinedMult = hanpoMultiplier * transcendMult;

  // 모래시계 배율 (X)
  const hourglassMult = getHourglassMultiplier(hourglassLevel);

  // 최종 배율 (R = D2 * X)
  const finalMultiplier = combinedMult * hourglassMult;

  // 기준 환포 (B = A / R)
  const baseHanpoNeeded = targetHanpo / finalMultiplier;

  // 획득 레벨 찾기
  const found = findLevelForHanpo(baseHanpoNeeded);
  const acquiredLevel = found ? found.level : null;
  const acquiredBaseHanpo = found ? found.hanpo : 0;

  // 실제 획득 환포 (B * D2)
  const actualHanpo = acquiredBaseHanpo * combinedMult;

  // 현재 레벨 기본 환포
  const currentBaseHanpo = getHanpoAtLevel(currentLevel);

  // 현재 레벨 배율 적용 환포
  const currentHanpoWithMult = currentBaseHanpo * combinedMult;

  // 윤회 축복 배율
  const rebirthMult = getRebirthMultiplier(transcendLevel);
  const rebirthHanpo = currentHanpoWithMult * rebirthMult;

  return {
    hanpoMultiplier,
    transcendMult,
    combinedMult,
    hourglassMult,
    finalMultiplier,
    baseHanpoNeeded,
    acquiredLevel,
    acquiredBaseHanpo,
    actualHanpo,
    currentLevel,
    currentBaseHanpo,
    currentHanpoWithMult,
    rebirthMult,
    rebirthHanpo
  };
}
