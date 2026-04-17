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
// 해당 돌로 도달 가능한 최대 레벨
// =========================
function findReachableLevel(artifact, stone) {
  let low = 0;
  let high = artifact.maxLevel;
  let answer = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cost = getStoneCostBetween(artifact, 0, mid);

    if (cost <= stone) {
      answer = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return answer;
}

// =========================
// 만렙 필요 총 돌
// =========================
function getMaxCost(artifact) {
  return getStoneCostBetween(artifact, 0, artifact.maxLevel);
}

// =========================
// 최대한 균등 분배 + 상한(cap) 처리
// water filling
// =========================
function equalDistributeWithCaps(totalStone, rows) {
  const n = rows.length;
  if (n === 0) return;

  // 우선 배분량 초기화
  for (const row of rows) {
    row.allocated = 0;
  }

  let remain = totalStone;
  let active = rows.slice();

  while (active.length > 0 && remain > 0) {
    const share = Math.floor(remain / active.length);

    // 더 이상 균등 몫이 0이면 1개씩 앞에서부터
    if (share <= 0) {
      for (const row of active) {
        if (remain <= 0) break;
        if (row.allocated < row.cap) {
          row.allocated += 1;
          remain -= 1;
        }
      }
      break;
    }

    let progressed = false;

    for (const row of active) {
      const room = row.cap - row.allocated;
      if (room <= 0) continue;

      const give = Math.min(share, room);
      if (give > 0) {
        row.allocated += give;
        remain -= give;
        progressed = true;
      }
    }

    active = active.filter(row => row.allocated < row.cap);

    if (!progressed) {
      break;
    }
  }
}

// =========================
// donor들에서 최대한 균등하게 빼기
// amount 만큼 회수 시도
// 성공 시 true, 실패 시 false
// =========================
function pullEvenlyFromDonors(donors, amount) {
  if (amount <= 0) return true;
  if (!donors || donors.length === 0) return false;

  const totalAvailable = donors.reduce((sum, row) => sum + row.allocated, 0);
  if (totalAvailable < amount) return false;

  let need = amount;

  while (need > 0) {
    const active = donors.filter(row => row.allocated > 0);
    if (active.length === 0) return false;

    const share = Math.floor(need / active.length);

    if (share <= 0) {
      // 1개씩 앞에서부터 회수
      for (const row of active) {
        if (need <= 0) break;
        if (row.allocated > 0) {
          row.allocated -= 1;
          need -= 1;
        }
      }
      continue;
    }

    let removedThisRound = 0;

    for (const row of active) {
      const take = Math.min(share, row.allocated);
      if (take > 0) {
        row.allocated -= take;
        need -= take;
        removedThisRound += take;
      }
    }

    if (removedThisRound <= 0) {
      // 안전장치
      for (const row of active) {
        if (need <= 0) break;
        if (row.allocated > 0) {
          row.allocated -= 1;
          need -= 1;
          removedThisRound += 1;
        }
      }
      if (removedThisRound <= 0) return false;
    }
  }

  return true;
}

// =========================
// 핵심 계산
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

    const cap = getMaxCost(artifact);

    return {
      no: index + 1,
      id,
      name: artifact.name,
      artifact,
      cap,          // 만렙까지 필요한 총 돌
      allocated: 0, // 최종 배분량
      used: 0,
      level: 0,
      remain: 0,
      isMax: false
    };
  });

  // ---------------------------------
  // 1단계: cap(만렙 필요량) 상한을 둔 균등 분배
  // ---------------------------------
  equalDistributeWithCaps(totalStone, rows);

  // ---------------------------------
  // 2단계: 현재 배분량 기준 레벨 계산
  // ---------------------------------
  function refreshResult() {
    for (const row of rows) {
      row.level = findReachableLevel(row.artifact, row.allocated);
      row.used = getStoneCostBetween(row.artifact, 0, row.level);
      row.remain = row.allocated - row.used;
      row.isMax = row.allocated >= row.cap;
    }
  }

  refreshResult();

  // ---------------------------------
  // 3단계:
  // 균등 분배 상태를 최대한 유지하면서
  // 만렙까지 조금만 더 필요한 유물을 완성
  // ---------------------------------
  while (true) {
    const nonMaxRows = rows.filter(row => !row.isMax);
    if (nonMaxRows.length <= 1) break;

    // 만렙까지 추가 필요량이 가장 작은 유물 우선
    const candidates = nonMaxRows
      .map(row => ({
        row,
        extraNeed: row.cap - row.allocated
      }))
      .filter(x => x.extraNeed > 0)
      .sort((a, b) => {
        if (a.extraNeed !== b.extraNeed) return a.extraNeed - b.extraNeed;
        return a.row.no - b.row.no;
      });

    if (candidates.length === 0) break;

    let improved = false;

    for (const candidate of candidates) {
      const target = candidate.row;
      const need = candidate.extraNeed;

      const donors = nonMaxRows.filter(row => row.id !== target.id);
      if (donors.length === 0) continue;

      // donor에서 균등하게 회수 가능한지 미리 복사본으로 테스트
      const snapshot = donors.map(row => ({
        id: row.id,
        allocated: row.allocated
      }));

      const tempDonors = snapshot.map(x => ({ ...x }));
      const ok = pullEvenlyFromDonors(tempDonors, need);

      if (!ok) {
        continue;
      }

      // 실제 반영
      pullEvenlyFromDonors(donors, need);
      target.allocated += need;

      refreshResult();
      improved = true;
      break;
    }

    if (!improved) {
      break;
    }
  }

  // ---------------------------------
  // 최종 결과 정리
  // ---------------------------------
  refreshResult();

  const usedStone = rows.reduce((sum, row) => sum + row.used, 0);
  const allocatedSum = rows.reduce((sum, row) => sum + row.allocated, 0);
  const remainingStone = totalStone - usedStone;

  return {
    totalStone,
    usedStone,
    remainingStone,
    artifactCount: rows.length,
    perArtifactBase: rows.length > 0 ? Math.floor(totalStone / rows.length) : 0,
    allocatedSum,
    rows: rows.map(row => ({
      no: row.no,
      name: row.name,
      allocatedStone: row.allocated,
      reachedLevel: row.level,
      usedStone: row.used,
      remainStone: row.remain,
      maxCheck: row.level >= row.artifact.maxLevel ? "O" : "X"
    }))
  };
}
