import { initExpData, getExpNeedForLevel } from "./exp.js";
import { saveInputs, loadInputs } from "../storage.js";
import {
  copyRoiToCanvas,
  createRoiInteraction,
  detectClassicRatio,
  drawCroppedFrame,
  drawRoiBox,
  formatNumber,
  formatPercent,
  startDisplayCapture,
  stopDisplayCapture
} from "./screen-exp-core.js";

await initExpData("../..");

if (new URLSearchParams(location.search).get("embed") === "1") {
  document.body.classList.add("measure-embed");
}

const IS_MEASURE_EMBED = document.body.classList.contains("measure-embed");

function postMeasureEmbedHeight() {
  if (!IS_MEASURE_EMBED || window.parent === window) return;
  requestAnimationFrame(() => {
    window.parent.postMessage({
      type: "iryuMeasureFrameHeight",
      height: document.documentElement.scrollHeight
    }, location.origin);
  });
}

if (IS_MEASURE_EMBED) {
  window.addEventListener("load", postMeasureEmbedHeight);
  window.addEventListener("resize", postMeasureEmbedHeight);
  window.addEventListener("message", event => {
    if (event.origin !== location.origin) return;
    if (event.data?.type === "iryuMeasureRequestHeight") postMeasureEmbedHeight();
    if (event.data?.type === "iryuMeasureTheme" && event.data.theme) {
      document.documentElement.setAttribute("data-theme", event.data.theme);
    }
  });
  if (window.ResizeObserver) {
    new ResizeObserver(postMeasureEmbedHeight).observe(document.body);
  }
  setTimeout(postMeasureEmbedHeight, 300);
}

const video = document.getElementById("video");
const preview = document.getElementById("preview");
const previewCanvas = document.getElementById("previewCanvas");
const roiBox = document.getElementById("roiBox");
const startShotPanel = document.getElementById("startShotPanel");
const endShotPanel = document.getElementById("endShotPanel");
const startCanvas = document.getElementById("startCanvas");
const endCanvas = document.getElementById("endCanvas");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const startRatioEl = document.getElementById("startRatioMetric");
const endRatioEl = document.getElementById("endRatioMetric");
const elapsedEl = document.getElementById("elapsedMetric");
const gainedEl = document.getElementById("gainedMetric");
const averageEl = document.getElementById("averageMetric");
const INPUT_IDS = ["startLevel", "endLevel", "hourglassLevel", "elapsedMinutes", "measureSeconds"];
const STORAGE_KEY = "screenExpSnapshot";

let stream = null;
let previewAnimation = null;
let startShot = null;
let endShot = null;
let startShotAt = 0;
let endShotAt = 0;
let measureTimer = null;
let measureStartedAt = 0;

loadSavedInputs();
setupGuideToggle();

const roiTool = createRoiInteraction(preview, previewCanvas, roiBox, {
  onCommit: () => setStatus("영역을 지정했습니다. 시작 캡처와 종료 캡처를 찍어 비교하세요.")
});

function setStatus(text) {
  statusEl.textContent = text;
}

function saveInputState() {
  const data = {};
  for (const id of INPUT_IDS) {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  }
  saveInputs(STORAGE_KEY, data);
}

function loadSavedInputs() {
  const saved = loadInputs(STORAGE_KEY);
  if (!saved) return;
  for (const id of INPUT_IDS) {
    const el = document.getElementById(id);
    if (el && saved[id] !== undefined) el.value = saved[id];
  }
}

function setupGuideToggle() {
  const guide = document.getElementById("screenGuide");
  const button = document.getElementById("screenGuideToggleBtn");
  if (!guide || !button) return;

  button.addEventListener("click", () => {
    const collapsed = guide.classList.toggle("collapsed");
    button.setAttribute("aria-expanded", String(!collapsed));
    button.textContent = collapsed ? "펼치기" : "접기";
  });
}

function drawPreviewLoop() {
  if (!stream) return;
  try {
    drawCroppedFrame(video, previewCanvas);
    drawRoiBox(roiBox, previewCanvas, roiTool.getRoi());
  } catch {
    // ignore early frames
  }
  previewAnimation = requestAnimationFrame(drawPreviewLoop);
}

async function startCapture() {
  if (previewAnimation) cancelAnimationFrame(previewAnimation);
  stopDisplayCapture(stream);
  stream = await startDisplayCapture(video, 6);
  document.getElementById("placeholder").hidden = true;
  drawPreviewLoop();
  setStatus("미리보기에서 경험치 바 영역을 직접 드래그하세요.");
}

function clearCanvas(canvas) {
  canvas.width = 0;
  canvas.height = 0;
}

function setShotPanelEmpty(panel, empty) {
  if (panel) panel.classList.toggle("shot-empty", empty);
}

function resetMeasurementView() {
  startShot = null;
  endShot = null;
  startShotAt = 0;
  endShotAt = 0;
  startRatioEl.textContent = "-";
  endRatioEl.textContent = "-";
  elapsedEl.textContent = "-";
  gainedEl.textContent = "-";
  averageEl.textContent = "-";
  clearCanvas(startCanvas);
  clearCanvas(endCanvas);
  setShotPanelEmpty(startShotPanel, true);
  setShotPanelEmpty(endShotPanel, true);
  resultEl.textContent = "자동 측정 중입니다. 종료 캡처 후 결과가 표시됩니다.";
}

function takeShot(kind) {
  if (!stream) {
    setStatus("먼저 화면을 선택하세요.");
    return;
  }
  const roi = roiTool.getRoi();
  if (!roi) {
    setStatus("경험치 바 영역을 먼저 지정하세요.");
    return;
  }

  drawCroppedFrame(video, previewCanvas);
  const detected = detectClassicRatio(previewCanvas, roi);
  if (detected.error) {
    setStatus(detected.error);
    return;
  }

  if (kind === "start") {
    copyRoiToCanvas(previewCanvas, startCanvas, roi, { padX: 8, padY: 10, minHeight: 96 });
    setShotPanelEmpty(startShotPanel, false);
    startShot = { ratio: detected.ratio, roi: { ...roi } };
    startShotAt = Date.now();
    startRatioEl.textContent = formatPercent(detected.ratio);
    setStatus(`시작 캡처 완료: ${formatPercent(detected.ratio)}`);
  } else {
    copyRoiToCanvas(previewCanvas, endCanvas, roi, { padX: 8, padY: 10, minHeight: 96 });
    setShotPanelEmpty(endShotPanel, false);
    endShot = { ratio: detected.ratio, roi: { ...roi } };
    endShotAt = Date.now();
    endRatioEl.textContent = formatPercent(detected.ratio);
    setStatus(`종료 캡처 완료: ${formatPercent(detected.ratio)}`);
  }
  updateElapsedMetric();
}

function getMeasureSeconds() {
  const seconds = Number(document.getElementById("measureSeconds").value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 60;
}

function startAutoMeasure() {
  if (!stream) {
    setStatus("먼저 화면을 선택하세요.");
    return;
  }
  if (!roiTool.getRoi()) {
    setStatus("경험치 바 영역을 먼저 지정하세요.");
    return;
  }

  stopAutoMeasure(false);
  resetMeasurementView();

  takeShot("start");
  if (!startShot) return;

  const seconds = getMeasureSeconds();
  measureStartedAt = Date.now();
  document.getElementById("elapsedMinutes").value = "";
  saveInputState();
  setStatus(`자동 측정 중... ${seconds}초 후 종료 캡처합니다.`);

  measureTimer = setTimeout(() => {
    measureTimer = null;
    takeShot("end");
    if (endShot) calculate();
  }, seconds * 1000);
}

function stopAutoMeasure(showStatus = true) {
  if (measureTimer) clearTimeout(measureTimer);
  measureTimer = null;
  measureStartedAt = 0;
  if (showStatus) setStatus("자동 측정을 중지했습니다.");
}

function updateElapsedMetric() {
  const minutes = getElapsedMinutes();
  elapsedEl.textContent = minutes > 0 ? `${minutes.toFixed(2)}분` : "-";
}

function getElapsedMinutes() {
  const manual = Number(document.getElementById("elapsedMinutes").value);
  if (Number.isFinite(manual) && manual > 0) return manual;
  if (startShotAt && endShotAt && endShotAt > startShotAt) return (endShotAt - startShotAt) / 60000;
  return 0;
}

function getHourglassMultiplier() {
  const hourglass = Number(document.getElementById("hourglassLevel").value);
  if (!Number.isInteger(hourglass) || hourglass < 0 || hourglass > 50) {
    return { error: "모래시계 레벨은 0~50 사이로 입력하세요." };
  }
  return { multiplier: 1 + hourglass * 0.1 };
}

function calculateGainedExp(startLevel, endLevel, startRatio, endRatio, hourglassMultiplier) {
  if (endLevel < startLevel) return { error: "종료 레벨은 시작 레벨보다 낮을 수 없습니다." };

  if (endLevel === startLevel) {
    if (endRatio <= startRatio) return { error: "같은 레벨에서는 종료 진행률이 시작 진행률보다 커야 합니다." };
    const info = getExpNeedForLevel(startLevel);
    if (info.error) return info;
    return { gained: info.expNeed * hourglassMultiplier * (endRatio - startRatio) };
  }

  let gained = 0;
  let info = getExpNeedForLevel(startLevel);
  if (info.error) return info;
  gained += info.expNeed * hourglassMultiplier * (1 - startRatio);

  for (let level = startLevel + 1; level < endLevel; level++) {
    info = getExpNeedForLevel(level);
    if (info.error) return info;
    gained += info.expNeed * hourglassMultiplier;
  }

  info = getExpNeedForLevel(endLevel);
  if (info.error) return info;
  gained += info.expNeed * hourglassMultiplier * endRatio;
  return { gained };
}

function calculate() {
  const startLevel = Number(document.getElementById("startLevel").value);
  const endLevelInput = document.getElementById("endLevel").value;
  const endLevel = endLevelInput === "" ? startLevel : Number(endLevelInput);
  if (!Number.isInteger(startLevel) || startLevel < 1 || !Number.isInteger(endLevel) || endLevel < 1) {
    setStatus("시작/종료 레벨을 올바르게 입력하세요.");
    return;
  }
  if (!startShot || !endShot) {
    setStatus("시작 캡처와 종료 캡처를 모두 찍어야 합니다.");
    return;
  }
  const hourglass = getHourglassMultiplier();
  if (hourglass.error) {
    setStatus(hourglass.error);
    return;
  }
  const elapsedMinutes = getElapsedMinutes();
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes <= 0) {
    setStatus("측정 시간을 입력하거나, 시작/종료 캡처 사이에 시간이 지나야 합니다.");
    return;
  }

  const calculated = calculateGainedExp(startLevel, endLevel, startShot.ratio, endShot.ratio, hourglass.multiplier);
  if (calculated.error) {
    setStatus(calculated.error);
    return;
  }

  const average = calculated.gained / elapsedMinutes;
  gainedEl.textContent = formatNumber(calculated.gained);
  averageEl.textContent = `${formatNumber(average)} / 분`;
  elapsedEl.textContent = `${elapsedMinutes.toFixed(2)}분`;
  resultEl.innerHTML = `
    <div class="result-section">
      <div class="result-title">시작/종료 비교 결과</div>
      <div class="result-row"><span class="result-label">시작 진행률</span><strong class="result-value">${formatPercent(startShot.ratio)}</strong></div>
      <div class="result-row"><span class="result-label">종료 진행률</span><strong class="result-value">${formatPercent(endShot.ratio)}</strong></div>
      <div class="result-row"><span class="result-label">획득 경험치</span><strong class="result-value">${formatNumber(calculated.gained)}</strong></div>
      <div class="summary-box">1분당 경험치: <strong>${formatNumber(average)}</strong></div>
    </div>
  `;
  setStatus("비교 계산 완료");
}

document.getElementById("captureBtn").addEventListener("click", () => startCapture().catch(error => setStatus(error.message)));
document.getElementById("measureBtn").addEventListener("click", startAutoMeasure);
document.getElementById("stopMeasureBtn").addEventListener("click", () => stopAutoMeasure(true));
document.getElementById("clearBtn").addEventListener("click", () => {
  roiTool.clearRoi();
  setStatus("영역을 지웠습니다.");
});
document.getElementById("elapsedMinutes").addEventListener("input", updateElapsedMetric);
for (const id of INPUT_IDS) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", saveInputState);
    el.addEventListener("change", saveInputState);
  }
}

window.addEventListener("beforeunload", () => stopDisplayCapture(stream));
