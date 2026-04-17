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
// 특정 레벨 -> 다음 레벨 필요 돌
// =========================
function getNextLevelCost(artifact, currentLevel) {
  if (currentLevel >= artifact.maxLevel) return Infinity;
  return getStoneCostBetween(artifact, currentLevel, currentLevel + 1);
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
// 다음 레벨 필요량이 작은 유물 우선 분배
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
      held: 0,
      isMax: false
    };
  });

  let pool = totalStone;

  while (pool > 0) {
    const activeRows = rows.filter(row => !row.isMax);
    if (activeRows.length === 0) break;

    // 다음 레벨 필요량이 작은 순으로 정렬
    activeRows.sort((a, b) => {
      const costA = getNextLevelCost(a.artifact, a.level) - a.held;
      const costB = getNextLevelCost(b.artifact, b.level) - b.held;

      if (costA !== costB) return costA - costB;
      return a.no - b.no;
    });

    let progressedThisCycle = false;

    for (const row of activeRows) {
      if (pool <= 0) break;
      if (row.isMax) continue;

      const nextCost = getNextLevelCost(row.artifact, row.level);

      if (!isFinite(nextCost)) {
        row.isMax = true;
        continue;
      }

      const need = nextCost - row.held;

      // 이미 held만으로도 다음 레벨 가능하면 바로 처리
      if (need <= 0) {
        const targetLevel = findReachableLevel(row.artifact, row.level, row.held);
        const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

        if (cost > 0) {
          row.level = targetLevel;
          row.used += cost;
          row.held -= cost;
          progressedThisCycle = true;
        }

        if (row.level >= row.artifact.maxLevel) {
          row.isMax = true;
        }

        continue;
      }

      // pool에서 필요한 만큼만 지급
      const give = Math.min(pool, need);
      row.held += give;
      pool -= give;

      const targetLevel = findReachableLevel(row.artifact, row.level, row.held);
      const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

      if (cost > 0) {
        row.level = targetLevel;
        row.used += cost;
        row.held -= cost;
        progressedThisCycle = true;
      }

      if (row.level >= row.artifact.maxLevel) {
        row.isMax = true;
      }
    }

    // 이번 사이클에서 아무 진전이 없으면 종료
    if (!progressedThisCycle) {
      break;
    }
  }

  const usedStone = rows.reduce((sum, row) => sum + row.used, 0);
  const heldStone = rows.reduce((sum, row) => sum + row.held, 0);
  const remainingStone = pool + heldStone;

  return {
    totalStone,
    usedStone,
    remainingStone,
    artifactCount: rows.length,
    perArtifactBase: rows.length > 0 ? Math.floor(totalStone / rows.length) : 0,
    rows: rows.map(row => ({
      no: row.no,
      name: row.name,
      allocatedStone: row.used + row.held,
      reachedLevel: row.level,
      usedStone: row.used,
      remainStone: row.held,
      maxCheck: row.level >= row.artifact.maxLevel ? "O" : "X"
    }))
  };
}
