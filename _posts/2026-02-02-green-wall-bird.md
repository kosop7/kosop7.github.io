---
layout: post
title: GREEN WALL BIRD
---

<style>
body {
  margin: 0;
  background: #111;
}
canvas {
  display: block;
  margin: 40px auto;
  background: linear-gradient(#6fb7ff, #dff2ff);
  border-radius: 14px;
}
</style>

<canvas id="game" width="360" height="640" tabindex="0"></canvas>

<script>
const c = document.getElementById("game");
const ctx = c.getContext("2d");
c.focus();

/* ===== STATE ===== */
let state = "title";
let score = 0;
let best = localStorage.getItem("birdBest") || 0;

/* ===== BIRD ===== */
const bird = { x: 120, y: 320, r: 14, v: 0 };
const gravity = 0.45;
const jump = -7;

/* ===== WALLS ===== */
const gap = 150;
const walls = [];
let frame = 0;

/* ===== INPUT ===== */
function flap() {
  if (state === "title" || state === "over") {
    reset();
    state = "play";
  }
  bird.v = jump;
}
document.addEventListener("keydown", flap);
c.addEventListener("click", flap);

/* ===== RESET ===== */
function reset() {
  bird.y = 320;
  bird.v = 0;
  walls.length = 0;
  score = 0;
  frame = 0;
}

/* ===== UPDATE ===== */
function update() {
  if (state !== "play") return;

  bird.v += gravity;
  bird.y += bird.v;

  if (frame % 110 === 0) {
    const top = Math.random() * 220 + 60;
    walls.push({ x: c.width, top, passed:false });
  }

  walls.forEach(w => {
    w.x -= 2.6;

    if (!w.passed && w.x + 50 < bird.x) {
      w.passed = true;
      score++;
      best = Math.max(best, score);
      localStorage.setItem("birdBest", best);
    }

    if (
      bird.x + bird.r > w.x &&
      bird.x - bird.r < w.x + 50 &&
      (bird.y - bird.r < w.top || bird.y + bird.r > w.top + gap)
    ) {
      state = "over";
    }
  });

  if (bird.y > c.height || bird.y < 0) {
    state = "over";
  }

  frame++;
}

/* ===== DRAW ===== */
function draw() {
  ctx.clearRect(0,0,c.width,c.height);

  ctx.fillStyle = "#2ecc71";
  walls.forEach(w => {
    ctx.fillRect(w.x, 0, 50, w.top);
    ctx.fillRect(w.x, w.top + gap, 50, c.height);
  });

  ctx.fillStyle = "#ffd84a";
  ctx.beginPath();
  ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(bird.x+4, bird.y-4, 2, 0, Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "20px sans-serif";
  ctx.fillText(score, c.width/2 - 6, 40);

  if (state !== "play") {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle="#fff";
    ctx.font="22px serif";
    ctx.fillText("GREEN WALL BIRD", 70, 300);
    ctx.font="14px sans-serif";
    ctx.fillText("Click or Press Key", 110, 340);
    if(state==="over"){
      ctx.fillText(`Best: ${best}`, 140, 370);
    }
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
</script>
