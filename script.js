/************ ELEMENTS ************/
const blocksContainer = document.querySelector(".blocks");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const modalTitle = document.getElementById("modalTitle");

const scoreBox = document.querySelector(".score");
const highScoreBox = document.querySelector(".highscore");

/************ GAME VARS ************/
let currentShape;
let currentRow;
let currentCol;
let currentColor;

let gameOver = false;
let gameLoop = null;

let score = 0;
let highScore = localStorage.getItem("highScore") || 0;

/************ CONSTANTS ************/
const COLORS = ["red", "blue", "green", "yellow", "purple"];
const gap = 2;

/************ GRID SETUP ************/
const containerWidth = blocksContainer.clientWidth;
const containerHeight = blocksContainer.clientHeight;

const cols = Math.floor(containerWidth / 50);
const rows = Math.floor(containerHeight / 50);

const blockWidth = (containerWidth - gap * (cols - 1)) / cols;
const blockHeight = (containerHeight - gap * (rows - 1)) / rows;

blocksContainer.innerHTML = "";
for (let i = 0; i < rows * cols; i++) {
  const block = document.createElement("div");
  block.classList.add("innerblock");
  block.style.width = `${blockWidth}px`;
  block.style.height = `${blockHeight}px`;
  block.style.backgroundColor = "#111";
  blocksContainer.appendChild(block);
}

const allBlocks = document.querySelectorAll(".innerblock");

/************ GRID STATE ************/
let gridState = Array(rows * cols).fill(false);

/************ SHAPES ************/
const SHAPES = [
  [[0,0],[1,0],[2,0],[3,0]],        // I
  [[0,0],[1,0],[2,0],[2,1]],        // L
  [[0,1],[1,1],[2,1],[2,0]],        // J
  [[0,0],[0,1],[1,0],[1,1]],        // Square
  [[0,0],[0,1],[1,1],[1,2]]         // Z
];

/************ SCORE ************/
highScoreBox.innerText = `High Score: ${highScore}`;
scoreBox.innerText = `Score: 0`;

function updateScore(add) {
  score += add;
  scoreBox.innerText = `Score: ${score}`;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    highScoreBox.innerText = `High Score: ${highScore}`;
  }
}

/************ START GAME ************/
function startGame() {
  overlay.classList.add("hidden");

  gameOver = false;
  score = 0;
  scoreBox.innerText = `Score: 0`;

  gridState.fill(false);
  allBlocks.forEach(b => b.style.backgroundColor = "#111");

  spawnShape();
  drawShape();

  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(moveDown, 600);
}

startBtn.addEventListener("click", startGame);

/************ SPAWN ************/
function canSpawn(shape, r0, c0) {
  return shape.every(([r, c]) => {
    const row = r0 + r;
    const col = c0 + c;
    const index = row * cols + col;
    return (
      row >= 0 &&
      col >= 0 &&
      col < cols &&
      index >= 0 &&
      index < gridState.length &&
      !gridState[index]
    );
  });
}

function spawnShape() {
  currentShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  currentColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  currentRow = 0;
  currentCol = Math.floor(cols / 2);

  if (!canSpawn(currentShape, currentRow, currentCol)) {
    showGameOver();
  }
}

/************ DRAW / CLEAR ************/
function drawShape() {
  currentShape.forEach(([r, c]) => {
    const index = (currentRow + r) * cols + (currentCol + c);
    if (allBlocks[index]) {
      allBlocks[index].style.backgroundColor = currentColor;
    }
  });
}

function clearShape() {
  currentShape.forEach(([r, c]) => {
    const index = (currentRow + r) * cols + (currentCol + c);
    if (allBlocks[index]) {
      allBlocks[index].style.backgroundColor = "#111";
    }
  });
}

/************ MOVE DOWN ************/
function moveDown() {
  if (gameOver) return;

  clearShape();

  const hit = currentShape.some(([r, c]) => {
    const nextRow = currentRow + r + 1;
    const col = currentCol + c;
    const index = nextRow * cols + col;
    return nextRow >= rows || gridState[index];
  });

  if (hit) {
    currentShape.forEach(([r, c]) => {
      const index = (currentRow + r) * cols + (currentCol + c);
      gridState[index] = true;
    });

    // Add score for ONE SHAPE placed (not per block)
    updateScore(1); // ✅ 1 SHAPE = 1 SCORE

    drawShape();
    clearHorizontalMatches();
    spawnShape();
    return;
  }

  currentRow++;
  drawShape();
}

/************ HORIZONTAL POP ************/
function clearHorizontalMatches() {
  let popped = false; // sirf check karega: kuch bhi pop hua ya nahi

  for (let row = 0; row < rows; row++) {
    let streakColor = null;
    let streakStart = 0;
    let streakLength = 0;

    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      const color = allBlocks[index].style.backgroundColor;

      if (color !== "#111" && color === streakColor) {
        streakLength++;
      } else {
        if (streakLength >= 3) {
          popped = true;
          removeStreak(row, streakStart, streakLength);
        }
        streakColor = color;
        streakStart = col;
        streakLength = color !== "#111" ? 1 : 0;
      }
    }

    if (streakLength >= 3) {
      popped = true;
      removeStreak(row, streakStart, streakLength);
    }
  }

  // ✅ POP SCORE ONLY ONCE
  if (popped) {
    updateScore(5);
  }
}


function removeStreak(row, startCol, length) {
  for (let i = 0; i < length; i++) {
    const index = row * cols + (startCol + i);
    gridState[index] = false;
    allBlocks[index].style.backgroundColor = "#111";
  }
}


/************ CONTROLS ************/
document.addEventListener("keydown", e => {
  if (gameOver) return;

  if (e.key === "ArrowLeft") moveHorizontal(-1);
  if (e.key === "ArrowRight") moveHorizontal(1);
  if (e.key === "ArrowDown") moveDown(); // fast drop
});

function moveHorizontal(dir) {
  clearShape();

  const canMove = currentShape.every(([r, c]) => {
    const newCol = currentCol + c + dir;
    const row = currentRow + r;
    const index = row * cols + newCol;
    return newCol >= 0 && newCol < cols && !gridState[index];
  });

  if (canMove) currentCol += dir;
  drawShape();
}

/************ GAME OVER ************/
function showGameOver() {
  gameOver = true;
  clearInterval(gameLoop);
  gameLoop = null;

  modalTitle.innerText = "GAME OVER";
  startBtn.innerText = "RESTART";
  overlay.classList.remove("hidden");
}
