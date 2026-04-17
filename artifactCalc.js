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
// 예산 안에서 도달 가능한 최대 레벨 찾기
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
// 현재 배분량 기준으로 상태 다시 계산
// =========================
function recalcRowByAllocation(row) {
  const targetLevel = findReachableLevel(row.artifact, 0, row.allocated);
  const usedStone = getStoneCostBetween(row.artifact, 0, targetLevel);
  const remainStone = row.allocated - usedStone;
  const isMax = targetLevel >= row.artifact.maxLevel;

  row.level = targetLevel;
  row.used = usedStone;
  row.remain = remainStone;
  row.isMax = isMax;
}

// =========================
// 핵심: 엑셀 방식 분배
// 1) 처음엔 전체 균등 배분
// 2) 만렙 유물의 남는 돌만 회수
// 3) 회수한 돌을 미만렙 유물에 다시 균등 분배
// 4) 반복
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
      allocated: 0,
      level: 0,
      used: 0,
      remain: 0,
      isMax: false
    };
  });

  // -------------------------
  // 1차 균등 배분
  // -------------------------
  const count = rows.length;
  const baseShare = Math.floor(totalStone / count);
  let leftoverPool = totalStone % count;

  rows.forEach(row => {
    row.allocated = baseShare;
    recalcRowByAllocation(row);
  });

  // -------------------------
  // 만렙 유물 남은 돌 재분배 반복
  // -------------------------
  while (true) {
    let reclaimed = 0;

    // 만렙 유물의 남는 돌만 회수
    rows.forEach(row => {
      if (row.isMax && row.remain > 0) {
        reclaimed += row.remain;
        row.allocated -= row.remain;
        row.remain = 0;
      }
    });

    reclaimed += leftoverPool;
    leftoverPool = 0;

    const activeRows = rows.filter(row => !row.isMax);

    if (reclaimed <= 0 || activeRows.length === 0) {
      leftoverPool = reclaimed;
      break;
    }

    const share = Math.floor(reclaimed / activeRows.length);
    leftoverPool = reclaimed % activeRows.length;

    if (share <= 0) {
      break;
    }

    activeRows.forEach(row => {
      row.allocated += share;
      recalcRowByAllocation(row);
    });
  }

  // -------------------------
  // 최종 남은 돌 계산
  // 미만렙 유물 remain + leftoverPool
  // -------------------------
  const finalRemaining =
    rows.reduce((sum, row) => sum + row.remain, 0) + leftoverPool;

  const finalUsed = totalStone - finalRemaining;

  return {
    totalStone,
    usedStone: finalUsed,
    remainingStone: finalRemaining,
    artifactCount: rows.length,
    perArtifactBase: baseShare,
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
