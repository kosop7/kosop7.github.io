---
layout: post
title: Clumsy Bird
---

<style>
html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

/* ===== 게임 영역 ===== */
.game-wrap {
  width: 100%;
  padding: 40px 0 60px;
}

canvas {
  display: block;
  margin: 0 auto;
  background: transparent;
}

.ui {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #222;
  font-weight: 800;
  pointer-events: none;
}

#score { top: 14px; font-size: 34px; }
#hint { bottom: 18%; font-size: 14px; opacity: .6; }
#over {
  top: 38%;
  font-size: 26px;
  display: none;
  text-align: center;
}
#over small {
  display: block;
  margin-top: 10px;
  font-size: 14px;
  opacity: .6;
}
</style>

<section class="game-wrap">
  <div style="position:relative;">
    <canvas id="game"></canvas>
    <div id="score" class="ui">0</div>
    <div id="hint" class="ui">탭 / 클릭 / 스페이스</div>
    <div id="over" class="ui">
      GAME OVER
      <small>다시 시작: 탭 / 클릭 / 스페이스</small>
    </div>
  </div>
</section>

<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function resize() {
  const maxWidth = Math.min(window.innerWidth, 520);
  const height = Math.min(window.innerHeight * 0.75, 680);

  canvas.style.width = maxWidth + 'px';
  canvas.style.height = height + 'px';
  canvas.width = maxWidth * DPR;
  canvas.height = height * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

/* ===== GAME ===== */
const GRAVITY = 0.45;
const FLAP = -8.5;
const PIPE_GAP = 160;
const PIPE_W = 60;
const PIPE_SPEED = 1.9;
const GROUND_H = 90;

let running = false;
let gameOver = false;
let score = 0;

const bird = { x:100, y:300, r:10, vy:0, rot:0 };
let pipes = [];
let spawnTimer = 0;

const scoreEl = document.getElementById('score');
const hintEl = document.getElementById('hint');
const overEl = document.getElementById('over');

function flap() {
  if (!running || gameOver) {
    reset();
    running = true;
    hintEl.style.display = 'none';
    return;
  }
  bird.vy = FLAP;
}

window.addEventListener('keydown', e => e.code === 'Space' && flap());
window.addEventListener('mousedown', flap);
window.addEventListener('touchstart', e => { e.preventDefault(); flap(); }, { passive:false });

function reset() {
  gameOver = false;
  score = 0;
  scoreEl.textContent = score;
  overEl.style.display = 'none';
  bird.y = canvas.height / DPR / 2;
  bird.vy = 0;
  pipes = [];
  spawnTimer = 0;
}

function addPipe() {
  pipes.push({
    x: canvas.width / DPR + 40,
    gapY: Math.random() * 260 + 120,
    passed:false
  });
}

function update() {
  if (!running || gameOver) return;

  bird.vy += GRAVITY;
  bird.y += bird.vy;
  bird.rot = Math.max(-0.4, Math.min(1.2, bird.vy / 12));

  spawnTimer++;
  if (spawnTimer > 120) { addPipe(); spawnTimer = 0; }

  pipes.forEach(p => {
    p.x -= PIPE_SPEED;
    if (!p.passed && p.x + PIPE_W < bird.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = score;
    }
    if (
      bird.x + bird.r > p.x &&
      bird.x - bird.r < p.x + PIPE_W &&
      (bird.y < p.gapY - PIPE_GAP/2 || bird.y > p.gapY + PIPE_GAP/2)
    ) gameOver = true;
  });

  if (bird.y > canvas.height / DPR - GROUND_H || bird.y < 0) gameOver = true;
  if (gameOver) overEl.style.display = 'block';
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#2ecc71';
  pipes.forEach(p=>{
    ctx.fillRect(p.x,0,PIPE_W,p.gapY-PIPE_GAP/2);
    ctx.fillRect(p.x,p.gapY+PIPE_GAP/2,PIPE_W,canvas.height/DPR);
  });

  ctx.fillStyle='#ffdf3a';
  ctx.beginPath();
  ctx.arc(bird.x,bird.y,14,0,Math.PI*2);
  ctx.fill();

  update();
  requestAnimationFrame(draw);
}
draw();
</script>
