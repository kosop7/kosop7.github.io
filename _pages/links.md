---
layout: page
title: Links
permalink: /links/
---

<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>새 도감</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  font-family: "Noto Serif KR", serif;
  height: 100%;
}

/* 중앙 고정 */
#book-stage {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 책 */
#book {
  width: 900px;
  height: 560px;
  display: flex;
  background: #4a3628;
  padding: 14px;
  border-radius: 6px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
}

/* 페이지 */
.page {
  width: 50%;
  background: #fbf8f2;
  padding: 26px;
  overflow: hidden;
}

.page.left { border-right: 1px solid #d6cfc4; }
.page.right { border-left: 1px solid #d6cfc4; }

/* 표지 */
.cover {
  background: #4a3628;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cover h1 {
  color: #ffffff;
}

/* 텍스트 */
.title {
  font-size: 22px;
  font-weight: bold;
  color: #3b2a1a;
}

.sci {
  font-style: italic;
  font-size: 14px;
  color: #6b5a4a;
  margin-bottom: 14px;
}

/* ⬇️ 참새 설명 글씨 크기 줄임 */
.desc {
  font-size: 13px;
  line-height: 1.7;
  color: #3b2a1a;
  white-space: pre-line;
}

/* 잠금 */
.locked {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #8b7a6a;
  font-size: 42px;
}

/* 사진 */
.photo-full {
  width: 100%;
  height: auto;
  object-fit: cover;
  border: 1px solid #b6a999;
}

/* 네비 */
#nav {
  margin-top: 16px;
}

#nav button {
  background: none;
  border: none;
  font-size: 28px;
  margin: 0 24px;
  cursor: pointer;
  color: #4a3628;
  opacity: 0.55;
}

#nav button:hover { opacity: 1; }
</style>
</head>

<body>

<div id="book-stage">
  <div id="book"></div>
  <div id="nav">
    <button onclick="prev()">‹</button>
    <button onclick="next()">›</button>
  </div>
</div>

<script>
const data = [
  { type: "cover" },
  { type: "guide" },

  {
    id: "sparrow",
    name: "참새",
    sci: "Passer montanus",
    unlocked: true,
    desc: `
참새는 대한민국 전역에서 가장 흔히 관찰되는 소형 조류로,
사람의 생활권과 밀접하게 공존하는 대표적인 텃새이다.

몸길이는 약 14cm 정도이며,
머리 옆의 검은 반점과 갈색·회색이 섞인 깃털이 특징이다.
암수의 외형 차이는 거의 없다.

마을, 도시, 농경지, 공원 등 다양한 환경에 적응하며
전봇대, 건물 틈, 나무 구멍 등에 둥지를 튼다.

먹이는 곡식의 씨앗, 잡초 종자, 작은 곤충 등으로
계절에 따라 식성이 달라진다.

짹짹거리는 울음소리를 자주 내며
무리를 지어 행동하는 경우가 많다.
`
  },

  {
    id: "crow",
    name: "까마귀",
    sci: "Corvus corone",
    unlocked: true,
    desc: "높은 지능과 적응력을 가진 대형 조류."
  },
  {
    id: "pigeon",
    name: "비둘기",
    sci: "Columba livia",
    unlocked: true,
    desc: "도시 환경에 잘 적응한 새."
  },
  {
    id: "eagle",
    name: "독수리",
    sci: "Aquila chrysaetos",
    unlocked: false
  }
];

let index = 0;
const book = document.getElementById("book");

function render() {
  book.innerHTML = "";
  book.append(makePage(data[index], "left"));
  book.append(makePage(data[index + 1], "right"));
}

function makePage(d, side) {
  const p = document.createElement("div");
  p.className = `page ${side}`;
  if (!d) return p;

  if (d.type === "cover") {
    p.classList.add("cover");
    p.innerHTML = "<h1>새 도감</h1><p>나만의 기록형 도감</p>";
    return p;
  }

  if (d.type === "guide") {
    p.innerHTML =
      "<div class='title'></div>" +
      "<div class='desc'>새를 직접 관찰하면 해금됨.</div>";
    return p;
  }

  if (side === "left") {
    p.innerHTML = `
      <div class="title">${d.name}</div>
      <div class="sci">${d.sci}</div>
      <div class="desc">${d.desc || ""}</div>
    `;
  } else {
    if (!d.unlocked) {
      p.innerHTML = `<div class="locked">🔒</div>`;
    } else {
      /* ✅ 오른쪽 페이지: 관찰 사진 단독, 가로 100% */
      p.innerHTML = `
        <img src="assets/images/b2.jpg" alt="관찰 사진" class="photo-full">
      `;
    }
  }

  return p;
}

function next() {
  if (index < data.length - 2) {
    index += 2;
    render();
  }
}

function prev() {
  if (index > 0) {
    index -= 2;
    render();
  }
}

render();
</script>

</body>
</html>
