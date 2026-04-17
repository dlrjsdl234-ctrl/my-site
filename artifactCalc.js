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

function getMaxLevel(artifact) {
  return artifact.maxLevel;
}

function getLevelData(artifact, level) {
  return artifact.levels[level] || null;
}

function getStoneCostBetween(artifact, fromLevel, toLevel) {
  const fromData = getLevelData(artifact, fromLevel);
  const toData = getLevelData(artifact, toLevel);

  if (!fromData || !toData) return 0;
  return toData.cumStone - fromData.cumStone;
}

function findReachableLevel(artifact, currentLevel, budget) {
  const maxLevel = getMaxLevel(artifact);
  let low = currentLevel;
  let high = maxLevel;
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

function distributeArtifactStones(totalStone, selectedArtifactIds) {
  const rows = selectedArtifactIds.map((id, index) => {
    const artifact = getArtifact(id);

    if (!artifact) {
      throw new Error(`유물을 찾을 수 없음: ${id}`);
    }

    return {
      no: index + 1,
      id,
      name: artifact.name,
      artifact,
      currentLevel: 0,
      reachedLevel: 0,
      usedStone: 0,
      allocatedStone: 0,
      remainStone: 0,
      isMax: false
    };
  });

  let remainingStone = totalStone;

  while (remainingStone > 0) {
    const activeRows = rows.filter(row => !row.isMax);

    if (activeRows.length === 0) break;

    const share = Math.floor(remainingStone / activeRows.length);

    if (share <= 0) break;

    let progressed = false;

    for (const row of activeRows) {
      const maxLevel = getMaxLevel(row.artifact);

      if (row.currentLevel >= maxLevel) {
        row.isMax = true;
        continue;
      }

      const targetLevel = findReachableLevel(row.artifact, row.currentLevel, share);
      const spend = getStoneCostBetween(row.artifact, row.currentLevel, targetLevel);

      if (spend > 0) {
        row.currentLevel = targetLevel;
        row.reachedLevel = targetLevel;
        row.usedStone += spend;
        row.allocatedStone += share;
        remainingStone -= spend;
        progressed = true;
      } else {
        row.allocatedStone += share;
      }

      if (row.currentLevel >= maxLevel) {
        row.isMax = true;
      }
    }

    if (!progressed) {
      break;
    }
  }

  for (const row of rows) {
    row.remainStone = row.allocatedStone - row.usedStone;
  }

  return {
    totalStone,
    usedStone: totalStone - remainingStone,
    remainingStone,
    artifactCount: rows.length,
    perArtifactBase: Math.floor(totalStone / rows.length),
    rows: rows.map(row => ({
      no: row.no,
      name: row.name,
      allocatedStone: row.allocatedStone,
      reachedLevel: row.reachedLevel,
      usedStone: row.usedStone,
      remainStone: row.remainStone,
      maxCheck: row.isMax ? "O" : "X"
    }))
  };
}