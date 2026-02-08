/* 
 The Spirit of the Hive
 Canvas Only Game
 Mobile + PC Compatible
*/

// ======================
// BASIC ENGINE SETUP
// ======================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize", resize);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const uiHint = document.getElementById("hint");
const inventoryUI = document.getElementById("inventory");

const TAU = Math.PI * 2;
let time = 0;

// ======================
// INPUT SYSTEM
// ======================
const keys = {};
let touchPos = null;
let touchActive = false;

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("touchstart", e => {
  touchActive = true;
  touchPos = getTouchPos(e);
});
canvas.addEventListener("touchmove", e => {
  touchPos = getTouchPos(e);
});
canvas.addEventListener("touchend", () => {
  touchActive = false;
  touchPos = null;
});

function getTouchPos(e) {
  const t = e.touches[0];
  return { x: t.clientX, y: t.clientY };
}

// ======================
// AUDIO SYSTEM
// ======================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

function playTone(freq, dur = 0.2, type = "sine", vol = 0.1) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + dur);
}

function noise(dur = 0.5, vol = 0.05) {
  const bufferSize = audioCtx.sampleRate * dur;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  const g = audioCtx.createGain();
  g.gain.value = vol;
  src.buffer = buffer;
  src.connect(g);
  g.connect(audioCtx.destination);
  src.start();
}

// ======================
// GAME STATE
// ======================
let scene = 0;
let inventory = [];
let imagination = 0.4;
let trust = 0.3;
let stress = 0;

function addInventory(item) {
  if (!inventory.includes(item)) inventory.push(item);
}

// ======================
// UTILITIES
// ======================
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function drawText(txt, x, y, size = 14, col = "#fff", align = "center") {
  ctx.fillStyle = col;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(txt, x, y);
}

// ======================
// CHARACTER SYSTEM
// ======================

class Ana {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height * 0.65;
    this.vx = 0;
    this.vy = 0;
    this.dir = 1;
    this.eyePulse = 0;
    this.imaginationActive = false;
  }

  update() {
    const speed = stress > 0.6 ? 1.2 : 2.2;

    let mx = 0, my = 0;

    if (keys["arrowleft"] || keys["a"]) mx -= 1;
    if (keys["arrowright"] || keys["d"]) mx += 1;
    if (keys["arrowup"] || keys["w"]) my -= 1;
    if (keys["arrowdown"] || keys["s"]) my += 1;

    if (touchActive && touchPos) {
      const dx = touchPos.x - this.x;
      const dy = touchPos.y - this.y;
      const l = Math.hypot(dx, dy);
      if (l > 12) {
        mx = dx / l;
        my = dy / l;
      }
    }

    this.vx = lerp(this.vx, mx * speed, 0.25);
    this.vy = lerp(this.vy, my * speed, 0.25);

    this.x += this.vx;
    this.y += this.vy;

    this.x = clamp(this.x, 40, canvas.width - 40);
    this.y = clamp(this.y, 80, canvas.height - 40);

    if (mx !== 0) this.dir = Math.sign(mx);

    this.eyePulse += 0.05;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.dir, 1);

    // === BODY ===
    ctx.fillStyle = "#4b4a68";
    ctx.beginPath();
    ctx.roundRect(-12, 8, 24, 34, 6);
    ctx.fill();

    // === CARDIGAN (oversized) ===
    ctx.fillStyle = "#3b3a55";
    ctx.beginPath();
    ctx.roundRect(-18, 6, 36, 28, 10);
    ctx.fill();

    // === SKIRT (slightly twisted) ===
    ctx.fillStyle = "#5c5a7c";
    ctx.beginPath();
    ctx.roundRect(-14, 34, 28, 14, 6);
    ctx.fill();

    // === LEGS / SOCKS mismatch ===
    ctx.fillStyle = "#d6cfcf";
    ctx.fillRect(-8, 48, 6, 12);
    ctx.fillRect(2, 48, 6, 16);

    // === HEAD ===
    ctx.fillStyle = "#f0d4c0";
    ctx.beginPath();
    ctx.arc(0, -10, 14, 0, TAU);
    ctx.fill();

    // === HAIR (uneven bob) ===
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(-2, -14, 15, Math.PI * 0.1, Math.PI * 1.2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -14, 12, Math.PI * 1.9, Math.PI * 0.3);
    ctx.fill();

    // === EYES ===
    const pupilScale = lerp(3, 5, imagination);
    const fearScale = lerp(1, 1.3, stress);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-4, -12, pupilScale * fearScale, 0, TAU);
    ctx.arc(4, -12, pupilScale * fearScale, 0, TAU);
    ctx.fill();

    // === IMAGINATION STAR REFLECTION ===
    if (this.imaginationActive) {
      ctx.fillStyle = "#fff6c0";
      ctx.beginPath();
      ctx.arc(-3, -13, 1.5, 0, TAU);
      ctx.arc(5, -13, 1.5, 0, TAU);
      ctx.fill();
    }

    ctx.restore();

    // === IMAGINATION PARTICLES ===
    if (this.imaginationActive) {
      const colors = {
        curiosity: "#ffd966",
        fear: "#66ffe0",
        sadness: "#a98cff"
      };
      let c = colors.curiosity;
      if (stress > 0.6) c = colors.fear;
      if (scene === 2) c = colors.sadness;

      for (let i = 0; i < 6; i++) {
        const a = time * 0.05 + i;
        const r = 18 + Math.sin(time * 0.1 + i) * 6;
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.x + Math.cos(a) * r, this.y - 10 + Math.sin(a) * r, 2, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
}

// ======================
// FATHER CHARACTER
// ======================
class Father {
  constructor() {
    this.x = canvas.width * 0.65;
    this.y = canvas.height * 0.6;
    this.lookTimer = 0;
    this.looking = false;
  }

  update(dt) {
    this.lookTimer += dt;
    if (this.lookTimer > 10) {
      this.lookTimer = 0;
      this.looking = true;
      setTimeout(() => this.looking = false, 1800);
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // === BODY ===
    ctx.fillStyle = "#2c2c38";
    ctx.beginPath();
    ctx.roundRect(-14, 10, 28, 40, 8);
    ctx.fill();

    // === HEAD ===
    ctx.fillStyle = "#d8c2a8";
    ctx.beginPath();
    ctx.arc(0, -6, 14, 0, TAU);
    ctx.fill();

    // === GLASSES REFLECTION ===
    ctx.fillStyle = "rgba(180,200,255,0.6)";
    ctx.fillRect(-9, -12, 7, 6);
    ctx.fillRect(2, -12, 7, 6);

    // === RIGHT HAND (bandaged, swollen) ===
    ctx.fillStyle = "#ccc";
    ctx.beginPath();
    ctx.roundRect(12, 22, 8, 14, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(160,40,40,0.6)";
    ctx.beginPath();
    ctx.arc(16, 30, 4, 0, TAU);
    ctx.fill();

    // === LEFT HAND (holding object, trembling) ===
    ctx.save();
    ctx.translate(-18, 26);
    ctx.rotate(Math.sin(time * 0.2) * 0.1);
    ctx.fillStyle = "#d0b090";
    ctx.beginPath();
    ctx.roundRect(-4, -4, 8, 10, 3);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    // === SPACE COLOR TEMPERATURE EFFECT ===
    if (this.looking) {
      ctx.fillStyle = "rgba(100,120,255,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // === HONEY DROPLETS TRAIL ===
    for (let i = 0; i < 3; i++) {
      const dx = Math.sin(time * 0.1 + i) * 12;
      ctx.fillStyle = "rgba(255,200,80,0.6)";
      ctx.beginPath();
      ctx.arc(this.x + dx, this.y + 50 + i * 10, 3, 0, TAU);
      ctx.fill();
    }
  }
}

// ======================
// SPIRIT / SOLDIER
// ======================
class Spirit {
  constructor() {
    this.x = canvas.width * 0.5;
    this.y = canvas.height * 0.5;
    this.fearReaction = 0;
  }

  update() {
    const d = dist(player, this);
    this.fearReaction = clamp(1 - d / 120, 0, 1);
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    const morph = clamp(imagination + trust, 0, 1);

    // === SHADOW (distorted when fear) ===
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 36, 20 + this.fearReaction * 30, 8, 0, 0, TAU);
    ctx.fill();

    // === BODY ===
    ctx.fillStyle = "#3a3a3a";
    ctx.beginPath();
    ctx.roundRect(-12, 8, 24, 40, 6);
    ctx.fill();

    // === HEAD ===
    ctx.fillStyle = "#777";
    ctx.beginPath();
    ctx.arc(0, -6, 14 + morph * 2, 0, TAU);
    ctx.fill();

    // === FRANKENSTEIN BOLTS (high imagination/trust) ===
    if (morph > 0.7) {
      ctx.fillStyle = "#aaa";
      ctx.fillRect(-18, -6, 6, 4);
      ctx.fillRect(12, -6, 6, 4);
    }

    // === GOLDEN WOUND CRACKS ===
    if (morph > 0.6) {
      ctx.strokeStyle = "#ffd966";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 10);
      ctx.lineTo(0, 24);
      ctx.lineTo(6, 14);
      ctx.stroke();
    }

    // === EYES ===
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-4, -8, 2, 0, TAU);
    ctx.arc(4, -8, 2, 0, TAU);
    ctx.fill();

    // === HALO (curiosity) ===
    if (imagination > 0.6 && stress < 0.4) {
      ctx.strokeStyle = "rgba(200,220,255,0.5)";
      ctx.beginPath();
      ctx.arc(0, -10, 22, 0, TAU);
      ctx.stroke();
    }

    // === HAND GESTURES ===
    if (inventory.includes("bread") && inventory.includes("water")) {
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(12, 20);
      ctx.lineTo(24, 12);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#aaa";
      ctx.beginPath();
      ctx.moveTo(-12, 20);
      ctx.lineTo(-20, 28);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ======================
// ENTITIES
// ======================
const player = new Ana();
const father = new Father();
const spirit = new Spirit();

// ======================
// SCENE SYSTEM
// ======================
let hearingGauge = 0;
let discoveredWell = false;

let breadPos = { x: canvas.width * 0.45, y: canvas.height * 0.62 };
let waterPos = { x: canvas.width * 0.55, y: canvas.height * 0.62 };
let exitDoor = { x: canvas.width * 0.9, y: canvas.height * 0.6 };

let soldierFed = false;
let photoFound = false;

// ======================
// DRAW HELPERS
// ======================
function drawWellScene() {
  // Background
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, "#101020");
  g.addColorStop(1, "#020208");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground
  ctx.fillStyle = "#1c1c2a";
  ctx.fillRect(0, canvas.height * 0.65, canvas.width, canvas.height * 0.35);

  // Well
  ctx.fillStyle = "#3a3a48";
  ctx.beginPath();
  ctx.ellipse(canvas.width * 0.5, canvas.height * 0.6, 80, 30, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "#0a0a14";
  ctx.beginPath();
  ctx.ellipse(canvas.width * 0.5, canvas.height * 0.6, 50, 16, 0, 0, TAU);
  ctx.fill();

  // Breathing echo rings
  if (!discoveredWell) {
    for (let i = 0; i < 3; i++) {
      const r = 50 + Math.sin(time * 0.05 + i) * 6;
      ctx.strokeStyle = `rgba(180,200,255,${0.2 - i * 0.05})`;
      ctx.beginPath();
      ctx.ellipse(canvas.width * 0.5, canvas.height * 0.6, r, r * 0.4, 0, 0, TAU);
      ctx.stroke();
    }
  }
}

function drawHouseScene() {
  ctx.fillStyle = "#1a1624";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Kitchen floor
  ctx.fillStyle = "#242030";
  ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);

  // Table
  ctx.fillStyle = "#3a2a1a";
  ctx.fillRect(canvas.width * 0.4, canvas.height * 0.55, 160, 12);

  // Bread
  if (!inventory.includes("bread")) {
    ctx.fillStyle = "#d2a36a";
    ctx.beginPath();
    ctx.ellipse(breadPos.x, breadPos.y, 10, 6, 0, 0, TAU);
    ctx.fill();
  }

  // Water bottle
  if (!inventory.includes("water")) {
    ctx.fillStyle = "#7fcfff";
    ctx.beginPath();
    ctx.roundRect(waterPos.x - 6, waterPos.y - 10, 12, 20, 4);
    ctx.fill();
  }

  // Door
  ctx.fillStyle = "#402a20";
  ctx.fillRect(exitDoor.x - 20, exitDoor.y - 40, 40, 80);
}

function drawHideoutScene() {
  ctx.fillStyle = "#07070c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Light shafts
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(200,200,255,0.05)`;
    ctx.beginPath();
    ctx.moveTo(canvas.width * (0.2 + i * 0.25), 0);
    ctx.lineTo(canvas.width * (0.25 + i * 0.25), canvas.height);
    ctx.lineTo(canvas.width * (0.3 + i * 0.25), canvas.height);
    ctx.closePath();
    ctx.fill();
  }
}

// ======================
// GAMEPLAY LOGIC
// ======================
function updateWellScene(dt) {
  drawWellScene();
  player.update();
  player.draw();

  const wellPos = { x: canvas.width * 0.5, y: canvas.height * 0.6 };
  const d = dist(player, wellPos);

  if (d < 90 && !discoveredWell) {
    uiHint.innerText = "우물을 살펴보기 (F)";
    if (keys["f"]) {
      hearingGauge += dt * 0.4;
      imagination = clamp(imagination + dt * 0.1, 0, 1);
      stress = clamp(stress + dt * 0.05, 0, 1);

      // Breathing sound
      if (Math.random() < 0.05) playTone(120, 0.15, "sine", 0.04);

      // Ambient distractions
      if (Math.random() < 0.02) noise(0.1, 0.03);

      drawHearingGauge();

      if (hearingGauge > 1) {
        discoveredWell = true;
        uiHint.innerText = "지도에 물음표가 기록되었다.";
        setTimeout(() => {
          scene = 1;
          uiHint.innerText = "";
        }, 1500);
      }
    }
  } else {
    uiHint.innerText = "";
  }
}

function drawHearingGauge() {
  const w = canvas.width * 0.4;
  const h = 10;
  const x = canvas.width * 0.3;
  const y = 30;

  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#8fdcff";
  ctx.fillRect(x, y, w * hearingGauge, h);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(x, y, w, h);
}

function updateHouseScene(dt) {
  drawHouseScene();
  father.update(dt);
  father.draw();
  player.update();
  player.draw();

  stress = lerp(stress, father.looking ? 0.9 : 0.2, 0.05);

  // Bread pickup
  if (!inventory.includes("bread") && dist(player, breadPos) < 24) {
    uiHint.innerText = "빵 줍기 (F)";
    if (keys["f"]) {
      addInventory("bread");
      playTone(400, 0.1);
    }
  }

  // Water pickup
  if (!inventory.includes("water") && dist(player, waterPos) < 24) {
    uiHint.innerText = "물병 줍기 (F)";
    if (keys["f"]) {
      addInventory("water");
      playTone(500, 0.1);
    }
  }

  // Door escape
  if (inventory.includes("bread") && inventory.includes("water")) {
    if (dist(player, exitDoor) < 40) {
      uiHint.innerText = "몰래 나가기 (F)";
      if (keys["f"] && !father.looking) {
        playTone(200, 0.3);
        scene = 2;
        uiHint.innerText = "";
      }
    }
  }

  // Detection
  if (father.looking && dist(player, father) < 140) {
    stress = 1;
    ctx.fillStyle = "rgba(255,0,0,0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    uiHint.innerText = "들켰다… 숨으세요.";
  }
}

function updateHideoutScene(dt) {
  drawHideoutScene();
  spirit.update();
  spirit.draw();
  player.update();
  player.draw();

  const d = dist(player, spirit);

  if (!soldierFed) {
    if (d < 90) {
      uiHint.innerText = "빵과 물을 내려놓기 (F)";
      if (keys["f"] && inventory.includes("bread") && inventory.includes("water")) {
        inventory = [];
        soldierFed = true;
        trust = 0.7;
        imagination = 0.8;
        playTone(180, 0.5);
      }
    }
  } else if (!photoFound) {
    if (d > 80 && d < 140) {
      uiHint.innerText = "관찰하기 (F)";
      if (keys["f"]) {
        photoFound = true;
        playTone(600, 0.4);
      }
    }
  }

  // Fear reaction
  if (d < 50) {
    spirit.fearReaction = 1;
    stress = 1;
    ctx.fillStyle = "rgba(255,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    stress = lerp(stress, 0.2, 0.05);
  }

  if (photoFound) {
    uiHint.innerText = "군복 주머니에서 낡은 가족 사진을 발견했다.";
  }
}

// ======================
// INVENTORY UI
// ======================
function drawInventory() {
  inventoryUI.innerText = inventory.length
    ? "소지품: " + inventory.join(", ")
    : "";
}

// ======================
// MAIN LOOP
// ======================
let last = 0;
function loop(t) {
  const dt = (t - last) / 1000;
  last = t;
  time++;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Stress screen border hex effect
  if (stress > 0.6) {
    ctx.strokeStyle = "rgba(120,140,255,0.6)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    const pad = 10;
    ctx.moveTo(pad, pad + 20);
    ctx.lineTo(pad + 20, pad);
    ctx.lineTo(canvas.width - pad - 20, pad);
    ctx.lineTo(canvas.width - pad, pad + 20);
    ctx.lineTo(canvas.width - pad, canvas.height - pad - 20);
    ctx.lineTo(canvas.width - pad - 20, canvas.height - pad);
    ctx.lineTo(pad + 20, canvas.height - pad);
    ctx.lineTo(pad, canvas.height - pad - 20);
    ctx.closePath();
    ctx.stroke();
  }

  // Scene switch
  if (scene === 0) updateWellScene(dt);
  if (scene === 1) updateHouseScene(dt);
  if (scene === 2) updateHideoutScene(dt);

  drawInventory();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
