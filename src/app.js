/* ─────────────────────────────────────────
   INSIGHT.IO  –  Main Application Logic
   ERIC Robotics Full Stack Assignment
───────────────────────────────────────── */

'use strict';

// ── STATE ────────────────────────────────
const state = {
  mode: 'auto',      // 'auto' | 'manual'
  paused: false,
  battery: 100,
  zoom: 1.0,
  robot: { x: 0.52, y: 0.46 },  // relative map position
  robotAngle: -25,
  moving: { w: false, a: false, s: false, d: false },
  estopActive: false,
  frameCount: 0,
  lastTime: 0,
};

// ── CANVAS REFS ──────────────────────────
const mapCanvas   = document.getElementById('mapRender');
const mapCtx      = mapCanvas.getContext('2d');
const camCanvas   = document.getElementById('camCanvas');
const camCtx      = camCanvas.getContext('2d');
const camModal    = document.getElementById('camModalCanvas');
const camModalCtx = camModal.getContext('2d');

// ── UI REFS ──────────────────────────────
const robotOverlay = document.getElementById('robotOverlay');
const batteryFill  = document.getElementById('batteryFill');
const batteryVal   = document.getElementById('batteryVal');
const toastEl      = document.getElementById('toast');
const camModalEl   = document.getElementById('camModal');
const zoomSlider   = document.getElementById('zoomSlider');
const pauseBtn     = document.getElementById('pauseBtn');
const estopBtn     = document.getElementById('estopBtn');
const mapArea      = document.querySelector('.map-canvas');

// ─────────────────────────────────────────
// MAP RENDERER  (procedural warehouse map)
// ─────────────────────────────────────────
function drawMap(ctx, w, h, t) {
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#c8cdd6';
  ctx.fillRect(0, 0, w, h);

  // ── Outer floor (slightly tilted room) ──
  ctx.save();
  ctx.translate(w * .5, h * .45);
  ctx.rotate(-0.38);

  const fw = 380, fh = 340;

  // Outer walls
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.fillStyle = '#e8e4dc';
  roundRect(ctx, -fw/2, -fh/2, fw, fh, 4, true, true);

  // Pink / highlighted zones
  ctx.fillStyle = 'rgba(220, 80, 80, 0.28)';
  roundRect(ctx, -fw/2 + 20, -fh/2 + 20, 140, 80, 3, true, false);
  roundRect(ctx, -fw/2 + 20, -fh/2 + 120, 100, 60, 3, true, false);
  roundRect(ctx, fw/2 - 130, -fh/2 + 60, 110, 140, 3, true, false);
  roundRect(ctx, -fw/2 + 60, fh/2 - 100, 260, 80, 3, true, false);

  // Internal walls / corridors
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-fw/2 + 160, -fh/2);
  ctx.lineTo(-fw/2 + 160, -fh/2 + 140);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-fw/2, -fh/2 + 110);
  ctx.lineTo(-fw/2 + 160, -fh/2 + 110);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(fw/2 - 130, -fh/2 + 60);
  ctx.lineTo(fw/2 - 130, -fh/2 + 200);
  ctx.stroke();

  // Obstacles / machines (small squares)
  const obstacles = [
    [-120, -80], [60, -100], [140, -50],
    [-60, 60], [100, 40], [160, 100],
    [-140, 120], [40, 130], [-20, -140],
    [80, -140], [-80, 140],
  ];
  ctx.fillStyle = '#999';
  obstacles.forEach(([ox, oy]) => {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(Math.random() * 0.4 - 0.2); // slight tilt
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.restore();
  });

  // Waypoints / nodes
  const nodes = [[-100, -50], [20, -20], [120, 80], [-40, 100]];
  nodes.forEach(([nx, ny]) => {
    ctx.beginPath();
    ctx.arc(nx, ny, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(60,80,200,.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,140,255,.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Animated path trace
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(74,158,255,.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  nodes.forEach(([nx, ny], i) => {
    if (i === 0) ctx.moveTo(nx, ny);
    else ctx.lineTo(nx, ny);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();

  // Corner scan effect (sweeping)
  const scanAngle = (t * 0.0005) % (Math.PI * 2);
  const cx = w * .52, cy = h * .46;
  const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
  gr.addColorStop(0, 'rgba(74,158,255,0.15)');
  gr.addColorStop(1, 'rgba(74,158,255,0)');
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 80, scanAngle, scanAngle + 0.8);
  ctx.closePath();
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ─────────────────────────────────────────
// CAMERA FEED RENDERER (simulated)
// ─────────────────────────────────────────
function drawCameraFeed(ctx, w, h, t, detailed) {
  // Dark industrial warehouse look
  ctx.fillStyle = '#1a1a18';
  ctx.fillRect(0, 0, w, h);

  // Floor
  const floorGrad = ctx.createLinearGradient(0, h * .55, 0, h);
  floorGrad.addColorStop(0, '#3a3830');
  floorGrad.addColorStop(1, '#2a2820');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * .55, w, h * .45);

  // Perspective grid on floor
  ctx.strokeStyle = 'rgba(255,220,80,.12)';
  ctx.lineWidth = 0.5;
  const vanX = w * .5, vanY = h * .55;
  for (let i = 0; i <= 8; i++) {
    const x = (i / 8) * w;
    ctx.beginPath();
    ctx.moveTo(vanX, vanY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let j = 0; j <= 5; j++) {
    const fy = vanY + (j / 5) * (h - vanY);
    const spread = (fy - vanY) / (h - vanY);
    ctx.beginPath();
    ctx.moveTo(vanX - spread * w * .5, fy);
    ctx.lineTo(vanX + spread * w * .5, fy);
    ctx.stroke();
  }

  // Yellow safety railing
  const railX = w * .1;
  ctx.strokeStyle = '#e8c210';
  ctx.lineWidth = detailed ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(railX, h * .62);
  ctx.lineTo(railX + 80, h * .62);
  ctx.moveTo(railX, h * .62);
  ctx.lineTo(railX, h * .88);
  ctx.moveTo(railX + 80, h * .62);
  ctx.lineTo(railX + 80, h * .88);
  ctx.moveTo(railX, h * .75);
  ctx.lineTo(railX + 80, h * .75);
  // Posts
  for (let p = 0; p <= 4; p++) {
    ctx.moveTo(railX + p * 20, h * .62);
    ctx.lineTo(railX + p * 20, h * .88);
  }
  ctx.stroke();

  // Shelving / walls in background
  ctx.fillStyle = '#2e2c28';
  ctx.fillRect(w * .55, h * .2, w * .4, h * .35);
  ctx.fillStyle = '#252420';
  // Shelf lines
  for (let s = 0; s < 4; s++) {
    ctx.fillRect(w * .55, h * .2 + s * (h * .35 / 4), w * .4, 2);
  }

  // Light bloom from ceiling
  const lightGrad = ctx.createRadialGradient(w * .5, 0, 0, w * .5, 0, h * .6);
  lightGrad.addColorStop(0, 'rgba(255,240,200,.12)');
  lightGrad.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = lightGrad;
  ctx.fillRect(0, 0, w, h);

  // Scan lines (CRT effect)
  for (let sl = 0; sl < h; sl += 4) {
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    ctx.fillRect(0, sl, w, 2);
  }

  // Timestamp / HUD overlay
  if (detailed) {
    ctx.fillStyle = 'rgba(74,158,255,.8)';
    ctx.font = '10px DM Mono, monospace';
    const timeStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    ctx.fillText(timeStr, 8, h - 24);
    ctx.fillText('CAM-01  1280×720  H.264', 8, h - 10);

    // REC indicator
    const blink = Math.floor(t * .002) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#e02020';
      ctx.beginPath();
      ctx.arc(w - 20, 16, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '9px DM Mono, monospace';
      ctx.fillText('REC', w - 42, 20);
    }
  }

  // Vignette
  const vig = ctx.createRadialGradient(w/2, h/2, h*.2, w/2, h/2, h*.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// ─────────────────────────────────────────
// ROBOT POSITION
// ─────────────────────────────────────────
function updateRobotPosition() {
  const mapRect = mapArea.getBoundingClientRect();
  const x = state.robot.x * mapRect.width;
  const y = state.robot.y * mapRect.height;
  robotOverlay.style.left = x + 'px';
  robotOverlay.style.top  = y + 'px';
  robotOverlay.querySelector('.robot-icon').style.transform =
    `rotate(${state.robotAngle}deg)`;
}

// ─────────────────────────────────────────
// MAIN ANIMATION LOOP
// ─────────────────────────────────────────
function animate(t) {
  requestAnimationFrame(animate);
  state.frameCount++;

  const mw = mapCanvas.width, mh = mapCanvas.height;
  drawMap(mapCtx, mw, mh, t);

  drawCameraFeed(camCtx, camCanvas.width, camCanvas.height, t, false);

  if (camModalEl.classList.contains('open')) {
    drawCameraFeed(camModalCtx, camModal.width, camModal.height, t, true);
    if (state.frameCount % 60 === 0) {
      const lat = 8 + Math.floor(Math.random() * 10);
      document.getElementById('camLat').textContent = lat + 'ms';
    }
  }

  // Move robot when keys held
  if (!state.paused && !state.estopActive) {
    const spd = 0.0008;
    if (state.moving.w) state.robot.y = Math.max(0.1, state.robot.y - spd);
    if (state.moving.s) state.robot.y = Math.min(0.9, state.robot.y + spd);
    if (state.moving.a) state.robot.x = Math.max(0.05, state.robot.x - spd);
    if (state.moving.d) state.robot.x = Math.min(0.95, state.robot.x + spd);
  }

  updateRobotPosition();

  // Battery drain simulation
  if (state.frameCount % 600 === 0 && !state.estopActive) {
    state.battery = Math.max(12, state.battery - 1);
    batteryVal.textContent = state.battery + '%';
    batteryFill.style.width = state.battery + '%';
    if (state.battery < 20) {
      batteryFill.style.background = '#e02020';
    } else if (state.battery < 40) {
      batteryFill.style.background = '#f5a623';
    }
  }
}

// ─────────────────────────────────────────
// EVENT HANDLERS
// ─────────────────────────────────────────

// Mode toggle
document.getElementById('modeAuto').addEventListener('click', () => setMode('auto'));
document.getElementById('modeManual').addEventListener('click', () => setMode('manual'));

function setMode(m) {
  state.mode = m;
  document.getElementById('modeAuto').classList.toggle('active', m === 'auto');
  document.getElementById('modeManual').classList.toggle('active', m === 'manual');
  showToast(`Mode switched to ${m.toUpperCase()}`);
}

// Pause
pauseBtn.addEventListener('click', () => {
  state.paused = !state.paused;
  pauseBtn.innerHTML = state.paused ? '&#9654;' : '&#9646;&#9646;';
  pauseBtn.title = state.paused ? 'Resume Mission' : 'Pause Mission';
  showToast(state.paused ? 'Mission Paused' : 'Mission Resumed');
});

// Emergency Stop
estopBtn.addEventListener('click', () => {
  state.estopActive = !state.estopActive;
  estopBtn.style.animation = state.estopActive ? 'none' : '';
  estopBtn.style.background = state.estopActive
    ? 'radial-gradient(circle, #ffcc00, #cc0000)'
    : 'radial-gradient(circle at 40% 38%, #f5c518, #c41414 60%)';
  showToast(state.estopActive ? '🛑 EMERGENCY STOP ENGAGED' : '✅ Emergency Stop Released');
  if (state.estopActive) {
    // Stop all movement
    Object.keys(state.moving).forEach(k => state.moving[k] = false);
    updateDpadVisuals();
  }
});

// Quick Goal
document.getElementById('quickGoalBtn').addEventListener('click', () => {
  showToast('Quick Goal mode activated – click on map to set waypoint');
});

// Initiate
document.getElementById('initiateBtn').addEventListener('click', () => {
  if (state.estopActive) { showToast('⚠️ Release Emergency Stop first'); return; }
  showToast('Mission initiated ✓');
});

// Zoom
document.getElementById('zoomIn').addEventListener('click', () => adjustZoom(0.1));
document.getElementById('zoomOut').addEventListener('click', () => adjustZoom(-0.1));
zoomSlider.addEventListener('input', e => {
  state.zoom = e.target.value / 100;
  applyZoom();
});

function adjustZoom(delta) {
  state.zoom = Math.max(0.5, Math.min(2.0, state.zoom + delta));
  zoomSlider.value = state.zoom * 100;
  applyZoom();
}
function applyZoom() {
  mapCanvas.style.transform =
    `translate(-50%, -50%) scale(${state.zoom})`;
}

// Camera modal
document.getElementById('cameraThumb').addEventListener('click', () => {
  camModalEl.classList.add('open');
});
document.getElementById('camClose').addEventListener('click', () => {
  camModalEl.classList.remove('open');
});
camModalEl.addEventListener('click', e => {
  if (e.target === camModalEl) camModalEl.classList.remove('open');
});

// Sidebar nav
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// D-Pad buttons
document.getElementById('dUp').addEventListener('mousedown',    () => setMove('w', true));
document.getElementById('dDown').addEventListener('mousedown',  () => setMove('s', true));
document.getElementById('dLeft').addEventListener('mousedown',  () => setMove('a', true));
document.getElementById('dRight').addEventListener('mousedown', () => setMove('d', true));
document.addEventListener('mouseup', () => {
  Object.keys(state.moving).forEach(k => state.moving[k] = false);
  updateDpadVisuals();
});

// Touch support for D-Pad
['dUp','dDown','dLeft','dRight'].forEach(id => {
  const el = document.getElementById(id);
  const key = { dUp:'w', dDown:'s', dLeft:'a', dRight:'d' }[id];
  el.addEventListener('touchstart', e => { e.preventDefault(); setMove(key, true); });
  el.addEventListener('touchend',   e => { e.preventDefault(); setMove(key, false); });
});

// Keyboard controls
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['w','a','s','d'].includes(k)) {
    setMove(k, true);
    e.preventDefault();
  }
  if (e.key === 'Escape') camModalEl.classList.remove('open');
});
document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (['w','a','s','d'].includes(k)) setMove(k, false);
});

function setMove(key, val) {
  if (state.estopActive && val) return;
  state.moving[key] = val;
  if (val) {
    const angleMap = { w: -25, s: 155, a: 245, d: -65 };
    state.robotAngle = angleMap[key] || state.robotAngle;
  }
  updateDpadVisuals();
}

function updateDpadVisuals() {
  const map = { w: 'dUp', s: 'dDown', a: 'dLeft', d: 'dRight' };
  Object.entries(map).forEach(([key, id]) => {
    document.getElementById(id).classList.toggle('active-key', !!state.moving[key]);
  });
}

// Map click → set robot position
mapArea.addEventListener('click', e => {
  const rect = mapArea.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  // Avoid right panel area
  if (x > 0.88) return;
  state.robot.x = x;
  state.robot.y = y;
  showToast(`Waypoint set → (${(x * 100).toFixed(1)}%, ${(y * 100).toFixed(1)}%)`);
});

// ─────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// Resize map canvas responsively
function resizeMap() {
  const rect = document.querySelector('.map-area').getBoundingClientRect();
  mapCanvas.width  = Math.floor(rect.width  * 1.2);
  mapCanvas.height = Math.floor(rect.height * 1.2);
}

window.addEventListener('resize', resizeMap);
resizeMap();

// ── BOOT ──
requestAnimationFrame(animate);
updateRobotPosition();
showToast('Insight.IO Dashboard loaded ✓');
