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
// 실제 총량 보존형 분배
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
      held: 0,   // 현재 이 유물이 들고 있는 돌
      isMax: false
    };
  });

  let pool = totalStone;

  while (pool > 0) {
    const activeRows = rows.filter(row => !row.isMax);
    if (activeRows.length === 0) break;

    const share = Math.floor(pool / activeRows.length);
    if (share <= 0) break;

    // 실제 지급
    for (const row of activeRows) {
      row.held += share;
    }
    pool -= share * activeRows.length;

    let progressed = false;

    for (const row of activeRows) {
      const targetLevel = findReachableLevel(row.artifact, row.level, row.held);
      const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

      if (cost > 0) {
        row.level = targetLevel;
        row.used += cost;
        row.held -= cost;
        progressed = true;
      }

      if (row.level >= row.artifact.maxLevel) {
        row.isMax = true;
      }
    }

    // 못 쓴 돌은 다시 공용 풀로 회수
    let returned = 0;
    for (const row of activeRows) {
      if (row.held > 0) {
        returned += row.held;
        row.held = 0;
      }
    }
    pool += returned;

    if (!progressed) break;
  }

  // 자투리 1개씩 배분
  let safety = 0;
  while (pool > 0 && safety < 100000) {
    safety++;

    const activeRows = rows.filter(row => !row.isMax);
    if (activeRows.length === 0) break;

    let progressed = false;

    for (const row of activeRows) {
      if (pool <= 0) break;

      row.held += 1;
      pool -= 1;

      const targetLevel = findReachableLevel(row.artifact, row.level, row.held);
      const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

      if (cost > 0) {
        row.level = targetLevel;
        row.used += cost;
        row.held -= cost;
        progressed = true;
      }

      if (row.level >= row.artifact.maxLevel) {
        row.isMax = true;
      }
    }

    // 자투리 단계에서도 못 쓴 돌 회수
    let returned = 0;
    for (const row of rows) {
      if (row.held > 0) {
        returned += row.held;
        row.held = 0;
      }
    }
    pool += returned;

    if (!progressed) break;
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
    allocatedSum: totalStone - pool,
    rows: rows.map(row => {
      const remainStone = row.held;
      const allocatedStone = row.used + remainStone;

      return {
        no: row.no,
        name: row.name,
        allocatedStone,
        reachedLevel: row.level,
        usedStone: row.used,
        remainStone,
        maxCheck: row.level >= row.artifact.maxLevel ? "O" : "X"
      };
    })
  };
}
