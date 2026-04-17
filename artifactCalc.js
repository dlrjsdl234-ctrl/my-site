alert("새 artifactCalc.js 실행됨");
console.log("새 artifactCalc.js 실행됨");
// =========================
// 유물 가져오기 (sameAs 처리)
// =========================
function getArtifact(id) {
  const art = window.ARTIFACTS[id];
  if (!art) return null;

  if (art.sameAs) {
    const base = window.ARTIFACTS[art.sameAs];
    if (!base) return null;

    return {
      ...base,
      id: art.id,
      name: art.name,
      effect: art.effect || base.effect
    };
  }

  return art;
}

// =========================
// 레벨 데이터 접근
// =========================
function getLevelData(artifact, level) {
  return artifact.levels[level] || null;
}

// =========================
// 특정 구간 돌 소모량
// =========================
function getStoneCostBetween(artifact, fromLevel, toLevel) {
  const fromData = getLevelData(artifact, fromLevel);
  const toData = getLevelData(artifact, toLevel);

  if (!fromData || !toData) return 0;
  return toData.cumStone - fromData.cumStone;
}

// =========================
// 주어진 예산 안에서 도달 가능한 최대 레벨
// =========================
function findReachableLevel(artifact, currentLevel, budget) {
  let low = currentLevel;
  let high = artifact.maxLevel;
  let answer = currentLevel;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cost = getStoneCostBetween(artifact, currentLevel, mid);

    if (cost <= budget) {
      answer = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return answer;
}

// =========================
// 핵심:
// 모든 남은 돌을 계속 합쳐서 재분배
// =========================
function distributeArtifactStones(totalStone, artifactIds) {
  if (!Array.isArray(artifactIds) || artifactIds.length === 0) {
    throw new Error("선택된 유물이 없습니다.");
  }

  const rows = artifactIds.map((id, index) => {
    const artifact = getArtifact(id);

    if (!artifact) {
      throw new Error(`유물을 찾을 수 없음: ${id}`);
    }

    return {
      no: index + 1,
      id,
      name: artifact.name,
      artifact,
      level: 0,
      used: 0,
      allocated: 0,
      remain: 0,
      isMax: false
    };
  });

  let pool = totalStone;

  while (pool > 0) {
    const activeRows = rows.filter(row => !row.isMax);

    if (activeRows.length === 0) {
      break;
    }

    const share = Math.floor(pool / activeRows.length);

    if (share <= 0) {
      break;
    }

    let spentThisRound = 0;

    for (const row of activeRows) {
      if (row.isMax) continue;

      row.allocated += share;

      const targetLevel = findReachableLevel(row.artifact, row.level, share);
      const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

      if (cost > 0) {
        row.level = targetLevel;
        row.used += cost;
        spentThisRound += cost;
      }

      if (row.level >= row.artifact.maxLevel) {
        row.isMax = true;
      }
    }

    // 이번 라운드에서 실제로 쓴 돌만 제외
    // 안 쓴 돌은 자동으로 pool에 남아서 다음 라운드에 다시 분배됨
    pool -= spentThisRound;

    // 아무도 레벨업을 못 하면 종료
    if (spentThisRound <= 0) {
      break;
    }
  }

  // 최종 remain 계산
  for (const row of rows) {
    row.remain = row.allocated - row.used;
  }

  return {
    totalStone,
    usedStone: totalStone - pool,
    remainingStone: pool,
    artifactCount: rows.length,
    perArtifactBase: rows.length > 0 ? Math.floor(totalStone / rows.length) : 0,
    rows: rows.map(row => ({
      no: row.no,
      name: row.name,
      allocatedStone: row.allocated,
      reachedLevel: row.level,
      usedStone: row.used,
      remainStone: row.remain,
      maxCheck: row.isMax ? "O" : "X"
    }))
  };
}
