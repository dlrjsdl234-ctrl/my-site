/**
 * 화면 캡처 기반 경험치 바 측정 유틸 (beta)
 */

const EXP_FILL_COLORS = ["#bcff38", "#b1f135", "#a1da30"].map(hexToRgb);
const EXP_EMPTY_COLORS = ["#9a9a9a", "#9a989a", "#959595"].map(hexToRgb);
const EXP_COLOR_TOLERANCE = 42;

export async function startCapture(videoEl) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error("이 브라우저는 화면 캡처를 지원하지 않습니다.");
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 10 },
    audio: false
  });

  videoEl.srcObject = stream;
  await videoEl.play();
  return stream;
}

export function stopCapture(stream) {
  if (!stream) return;
  stream.getTracks().forEach(track => track.stop());
}

export function drawFrameToCanvas(videoEl, canvasEl) {
  const width = videoEl.videoWidth;
  const height = videoEl.videoHeight;

  if (!width || !height) {
    throw new Error("캡처 화면이 아직 준비되지 않았습니다.");
  }

  canvasEl.width = width;
  canvasEl.height = height;

  const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(videoEl, 0, 0, width, height);
  return ctx;
}

export function detectExpRatio(canvasEl, roi) {
  const normalized = normalizeRoi(roi, canvasEl.width, canvasEl.height);
  if (!normalized) {
    return { error: "경험치 바 영역을 먼저 지정하세요." };
  }

  const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
  const image = ctx.getImageData(normalized.x, normalized.y, normalized.width, normalized.height);
  const columns = getColumnAverages(image.data, normalized.width, normalized.height);
  const sampleSize = Math.max(3, Math.floor(columns.length * 0.08));
  const filledSample = averageColors(columns.slice(0, sampleSize));
  const emptySample = averageColors(columns.slice(-sampleSize));

  let filledUntil = -1;
  let gap = 0;
  const maxGap = Math.max(6, Math.floor(columns.length * 0.05));

  for (let i = 0; i < columns.length; i++) {
    const color = columns[i];
    const filledDistance = colorDistance(color, filledSample);
    const emptyDistance = colorDistance(color, emptySample);

    if (filledDistance <= emptyDistance) {
      filledUntil = i;
      gap = 0;
    } else {
      gap++;
      if (filledUntil >= 0 && gap > maxGap) break;
    }
  }

  if (filledUntil < 0) {
    return { error: "경험치 바 진행률을 감지하지 못했습니다." };
  }

  const ratio = clamp((filledUntil + 1) / columns.length, 0, 1);
  return { ratio, roi: normalized };
}

export function findExpBarRoi(canvasEl) {
  const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
  const width = canvasEl.width;
  const height = canvasEl.height;

  if (!width || !height) {
    return { error: "캡처 화면이 아직 준비되지 않았습니다." };
  }

  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const candidates = [];
  const minRun = Math.max(80, Math.floor(width * 0.18));

  for (let y = 0; y < height; y++) {
    const segments = getPaletteSegments(data, width, y, minRun);
    for (const segment of segments) {
      const roi = expandPaletteSegmentToRoi(data, width, height, segment, y);
      if (!roi) continue;

      const score = scoreRoi(data, width, roi);
      if (score > 0) candidates.push({ roi, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) {
    return { error: "경험치 바 후보를 찾지 못했습니다. 직접 영역을 지정해 주세요." };
  }

  return { roi: best.roi, score: best.score };
}

export function calculateExpPerMinute(expNeed, startRatio, endRatio, elapsedSeconds) {
  expNeed = Number(expNeed);
  startRatio = Number(startRatio);
  endRatio = Number(endRatio);
  elapsedSeconds = Number(elapsedSeconds);

  if (!Number.isFinite(expNeed) || expNeed <= 0) {
    return { error: "레벨 경험치 데이터가 올바르지 않습니다." };
  }
  if (!Number.isFinite(startRatio) || !Number.isFinite(endRatio)) {
    return { error: "경험치 바 진행률을 계산하지 못했습니다." };
  }
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) {
    return { error: "측정 시간이 올바르지 않습니다." };
  }

  const deltaRatio = endRatio - startRatio;
  if (deltaRatio <= 0) {
    return { error: "경험치 바가 증가하지 않았습니다. 레벨업, 영역 오류, 색상 감지 실패 가능성이 있습니다." };
  }

  const gainedExp = expNeed * deltaRatio;
  return {
    deltaRatio,
    gainedExp,
    expPerMinute: gainedExp / elapsedSeconds * 60
  };
}

function normalizeRoi(roi, maxWidth, maxHeight) {
  if (!roi) return null;

  const x = Math.max(0, Math.min(roi.x, maxWidth));
  const y = Math.max(0, Math.min(roi.y, maxHeight));
  const width = Math.max(0, Math.min(roi.width, maxWidth - x));
  const height = Math.max(0, Math.min(roi.height, maxHeight - y));

  if (width < 10 || height < 4) return null;
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

function getColumnAverages(data, width, height) {
  const columns = [];
  const yStart = Math.floor(height * 0.12);
  const yEnd = Math.max(yStart + 1, Math.ceil(height * 0.88));
  const sampleHeight = yEnd - yStart;

  for (let x = 0; x < width; x++) {
    let r = 0;
    let g = 0;
    let b = 0;

    for (let y = yStart; y < yEnd; y++) {
      const idx = (y * width + x) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
    }

    columns.push({ r: r / sampleHeight, g: g / sampleHeight, b: b / sampleHeight });
  }

  return columns;
}

function getPaletteSegments(data, width, y, minRun) {
  const segments = [];
  let start = null;
  let lastMatch = null;
  let fillCount = 0;
  let emptyCount = 0;
  let knownCount = 0;
  const maxGap = Math.max(10, Math.floor(width * 0.015));

  for (let x = 1; x < width - 1; x++) {
    const current = getPixel(data, width, x, y);
    const isFill = isExpFillColor(current);
    const isEmpty = isExpEmptyColor(current);
    const isBarColor = isFill || isEmpty;

    if (isBarColor) {
      if (start === null) start = x;
      lastMatch = x;
      knownCount++;
      if (isFill) fillCount++;
      if (isEmpty) emptyCount++;
      continue;
    }

    if (start !== null && x - lastMatch > maxGap) {
      pushPaletteSegment(segments, start, lastMatch, fillCount, emptyCount, knownCount, minRun);
      start = null;
      lastMatch = null;
      fillCount = 0;
      emptyCount = 0;
      knownCount = 0;
    }
  }

  if (start !== null) {
    pushPaletteSegment(segments, start, lastMatch, fillCount, emptyCount, knownCount, minRun);
  }

  return segments;
}

function pushPaletteSegment(segments, x1, x2, fillCount, emptyCount, knownCount, minRun) {
  const segmentWidth = x2 - x1 + 1;
  const density = knownCount / segmentWidth;

  if (segmentWidth < minRun) return;
  if (density < 0.35) return;
  if (fillCount < Math.max(3, segmentWidth * 0.01)) return;
  if (emptyCount < Math.max(10, segmentWidth * 0.08)) return;

  segments.push({ x1, x2, fillCount, emptyCount, knownCount, density });
}

function expandPaletteSegmentToRoi(data, width, height, segment, centerY) {
  let top = centerY;
  let bottom = centerY;
  const maxExpand = Math.max(8, Math.floor(height * 0.03));

  while (top > 0 && centerY - top < maxExpand) {
    if (getPaletteRowDensity(data, width, segment.x1, segment.x2, top - 1) < 0.18) break;
    top--;
  }

  while (bottom < height - 1 && bottom - centerY < maxExpand) {
    if (getPaletteRowDensity(data, width, segment.x1, segment.x2, bottom + 1) < 0.18) break;
    bottom++;
  }

  const roi = {
    x: Math.max(0, segment.x1 - 2),
    y: top,
    width: Math.min(width - segment.x1, segment.x2 - segment.x1 + 5),
    height: bottom - top + 1
  };

  const ratio = roi.width / Math.max(1, roi.height);
  if (roi.width < width * 0.18 || roi.height < 4 || roi.height > 40 || ratio < 18) return null;
  return roi;
}

function getPaletteRowDensity(data, width, x1, x2, y) {
  let matched = 0;
  let total = 0;
  const start = Math.max(0, Math.round(x1));
  const end = Math.min(width - 1, Math.round(x2));
  const step = Math.max(1, Math.floor((end - start) / 240));

  for (let x = start; x <= end; x += step) {
    const color = getPixel(data, width, x, y);
    if (isExpFillColor(color) || isExpEmptyColor(color)) matched++;
    total++;
  }

  return total === 0 ? 0 : matched / total;
}

function scoreRoi(data, canvasWidth, roi) {
  const ratio = roi.width / Math.max(1, roi.height);
  const sampleY = roi.y + Math.floor(roi.height / 2);
  const left = sampleHorizontalAverage(data, canvasWidth, roi.x, roi.x + Math.floor(roi.width * 0.15), sampleY);
  const right = sampleHorizontalAverage(data, canvasWidth, roi.x + Math.floor(roi.width * 0.85), roi.x + roi.width - 1, sampleY);
  const fillContrast = colorDistance(left, right);
  const saturation = getSaturation(left);
  const colorMatch = getExpColorMatchScore(data, canvasWidth, roi);

  return (roi.width * 0.8) + (ratio * 12) + (fillContrast * 3) + (saturation * 120) + (colorMatch * 900);
}

function getExpColorMatchScore(data, width, roi) {
  const y = roi.y + Math.floor(roi.height / 2);
  let matched = 0;
  let total = 0;
  const step = Math.max(1, Math.floor(roi.width / 160));

  for (let x = roi.x; x < roi.x + roi.width; x += step) {
    const color = getPixel(data, width, x, y);
    if (isExpFillColor(color) || isExpEmptyColor(color)) matched++;
    total++;
  }

  return total === 0 ? 0 : matched / total;
}

function sampleHorizontalAverage(data, width, x1, x2, y) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const start = Math.max(0, Math.round(x1));
  const end = Math.min(width - 1, Math.round(x2));

  for (let x = start; x <= end; x++) {
    const color = getPixel(data, width, x, y);
    r += color.r;
    g += color.g;
    b += color.b;
    count++;
  }

  return { r: r / count, g: g / count, b: b / count };
}

function getPixel(data, width, x, y) {
  const idx = (Math.round(y) * width + Math.round(x)) * 4;
  return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
}

function getBrightness(color) {
  return (color.r + color.g + color.b) / 3;
}

function getSaturation(color) {
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  return max === 0 ? 0 : (max - min) / max;
}

function isExpFillColor(color) {
  return nearestColorDistance(color, EXP_FILL_COLORS) <= EXP_COLOR_TOLERANCE;
}

function isExpEmptyColor(color) {
  return nearestColorDistance(color, EXP_EMPTY_COLORS) <= EXP_COLOR_TOLERANCE;
}

function nearestColorDistance(color, palette) {
  return palette.reduce((min, target) => Math.min(min, colorDistance(color, target)), Infinity);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function averageColors(colors) {
  const total = colors.reduce((acc, color) => {
    acc.r += color.r;
    acc.g += color.g;
    acc.b += color.b;
    return acc;
  }, { r: 0, g: 0, b: 0 });

  return {
    r: total.r / colors.length,
    g: total.g / colors.length,
    b: total.b / colors.length
  };
}

function colorDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
