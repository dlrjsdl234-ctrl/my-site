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
// 모든 남은 돌을 계속 다시 합쳐서 재분배
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

    // 더 이상 균등 분배가 안 되면 종료
    if (share <= 0) {
      break;
    }

    let spentThisRound = 0;

    for (const row of activeRows) {
      if (row.isMax) continue;

      // 이번 라운드 share 추가
      row.allocated += share;

      // 핵심 수정:
      // 이전에 남아 있던 돌 + 이번에 받은 돌 전체를 기준으로 다시 계산
      const availableStone = row.allocated - row.used;

      const targetLevel = findReachableLevel(
        row.artifact,
        row.level,
        availableStone
      );

      const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

      if (cost > 0) {
        row.level = targetLevel;
        row.used += cost;
        spentThisRound += cost;
      }

      row.remain = row.allocated - row.used;

      if (row.level >= row.artifact.maxLevel) {
        row.isMax = true;
      }
    }

    // 실제 사용한 돌만 pool 에서 제거
    pool -= spentThisRound;

    // 아무도 레벨업 못 하면 종료
    if (spentThisRound <= 0) {
      break;
    }
  }

  // 마지막 남은 pool을 다시 균등 분배할 수 없었던 찌꺼기 돌로 보고
  // rows의 remain 합과 remainingStone이 서로 다를 수 있으니
  // remain은 각 유물에 실질적으로 잡혀 있는 잔여분만 유지
  for (const row of rows) {
    row.remain = row.allocated - row.used;
  }

  return {
    totalStone,
    usedStone: rows.reduce((sum, row) => sum + row.used, 0),
    remainingStone: totalStone - rows.reduce((sum, row) => sum + row.used, 0),
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
