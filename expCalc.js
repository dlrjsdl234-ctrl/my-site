// expCalc.js

export function calcRemainExp(currentExp, maxExp) {
  return maxExp - currentExp;
}

export function calcProgress(currentExp, maxExp) {
  if (maxExp === 0) return 0;
  return ((currentExp / maxExp) * 100).toFixed(2);
}

export function getExpInfo(currentExp, maxExp) {
  return {
    currentExp,
    maxExp,
    remainExp: calcRemainExp(currentExp, maxExp),
    progress: calcProgress(currentExp, maxExp)
  };
}