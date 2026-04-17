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
// 실제 지급 -> 사용 -> 남은 돌 회수 방식
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
      used: 0,          // 실제 누적 사용 돌
      allocated: 0,     // 실제 누적 배분 돌
      remain: 0,        // 현재 유물이 들고 있는 잔여 돌
      isMax: false
    };
  });

  let pool = totalStone;

  // -------------------------
  // 1) 균등 분배 반복
  // -------------------------
  while (pool > 0) {
    const activeRows = rows.filter(row => !row.isMax);

    if (activeRows.length === 0) {
      break;
    }

    const share = Math.floor(pool / activeRows.length);

    // 균등 분배가 안 되면 자투리 처리 단계로 이동
    if (share <= 0) {
      break;
    }

    // 실제로 먼저 분배
    for (const row of activeRows) {
      row.allocated += share;
      row.remain += share;
    }

    pool -= share * activeRows.length;

    let progressed = false;

    // 각 유물이 현재 들고 있는 remain으로 최대한 레벨업
    for (const row of activeRows) {
      if (row.isMax) continue;

      const targetLevel = findReachableLevel(row.artifact, row.level, row.remain);
      const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

      if (cost > 0) {
        row.level = targetLevel;
        row.used += cost;
        row.remain -= cost;
        progressed = true;
      }

      if (row.level >= row.artifact.maxLevel) {
        row.isMax = true;
      }
    }

    // 이번 라운드에서 각 유물이 못 쓴 잔여 remain을 다시 공용 풀로 회수
    let returnedStone = 0;
    for (const row of activeRows) {
      if (row.remain > 0) {
        returnedStone += row.remain;
        row.remain = 0;
      }
    }

    pool += returnedStone;

    // 아무도 진전이 없고, 다시 회수만 반복되면 무한루프 방지
    if (!progressed && share === 0) {
      break;
    }

    // share는 있었지만 아무도 레벨업 못한 경우에도
    // 그대로 다음 라운드 가면 같은 분배 반복이 될 수 있으니 종료
    if (!progressed) {
      break;
    }
  }

  // -------------------------
  // 2) 자투리 돌 1개씩 재분배
  // -------------------------
  // 남은 돌이 있고, 일부 유물은 다음 레벨까지 얼마 안 남았을 수 있으므로
  // 앞에서부터 1개씩 넣어보는 방식
  let guard = 0;
  while (pool > 0 && guard < 1000000) {
    guard++;

    const activeRows = rows.filter(row => !row.isMax);
    if (activeRows.length === 0) break;

    let gaveAny = false;

    for (const row of activeRows) {
      if (pool <= 0) break;

      row.allocated += 1;
      row.remain += 1;
      pool -= 1;
      gaveAny = true;

      const targetLevel = findReachableLevel(row.artifact, row.level, row.remain);
      const cost = getStoneCostBetween(row.artifact, row.level, targetLevel);

      if (cost > 0) {
        row.level = targetLevel;
        row.used += cost;
        row.remain -= cost;
      }

      if (row.level >= row.artifact.maxLevel) {
        row.isMax = true;
      }
    }

    // 한 바퀴 돌고도 아무 배분도 못 했으면 종료
    if (!gaveAny) break;

    // 자투리 단계에서도 못 쓴 remain은 다시 회수
    let returnedStone = 0;
    for (const row of rows) {
      if (!row.isMax && row.remain > 0) {
        returnedStone += row.remain;
        row.remain = 0;
      }
    }

    // 전부 다시 회수됐으면 더 이상 올릴 수 없는 상태라 종료
    if (returnedStone === activeRows.length || returnedStone > 0) {
      // 다만 pool이 그대로 반복될 수 있으므로
      // 실제로 이번 사이클에 레벨업이 하나도 없었는지 체크
      const beforePool = pool;
      pool += returnedStone;

      // 만약 1개씩 나눴다가 전부 그대로 돌아온 상태면 종료
      if (pool === beforePool + returnedStone) {
        const anyCanProgress = rows.some(row => {
          if (row.isMax) return false;
          return findReachableLevel(row.artifact, row.level, 1) > row.level;
        });

        if (!anyCanProgress) {
          break;
        }
      }
    }
  }

  const usedStone = rows.reduce((sum, row) => sum + row.used, 0);
  const allocatedStone = rows.reduce((sum, row) => sum + row.allocated, 0);
  const remainStone = totalStone - usedStone;

  return {
    totalStone,
    usedStone,
    remainingStone: remainStone,
    artifactCount: rows.length,
    perArtifactBase: rows.length > 0 ? Math.floor(totalStone / rows.length) : 0,
    allocatedSum: allocatedStone,
    rows: rows.map(row => ({
      no: row.no,
      name: row.name,
      allocatedStone: row.allocated,
      reachedLevel: row.level,
      usedStone: row.used,
      remainStone: row.allocated - row.used,
      maxCheck: row.level >= row.artifact.maxLevel ? "O" : "X"
    }))
  };
}
