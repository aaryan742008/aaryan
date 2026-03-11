const WHITE = "w";
const BLACK = "b";

const PIECES = {
  wp: "♙",
  wr: "♖",
  wn: "♘",
  wb: "♗",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  br: "♜",
  bn: "♞",
  bb: "♝",
  bq: "♛",
  bk: "♚",
};

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");

let board = [];
let currentTurn = WHITE;
let selected = null;
let legalMoves = [];

function createInitialBoard() {
  return [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
  ];
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function colorOf(piece) {
  return piece ? piece[0] : null;
}

function renderBoard() {
  boardEl.innerHTML = "";

  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      const square = document.createElement("button");
      square.type = "button";
      square.className = `square ${(r + c) % 2 === 0 ? "light" : "dark"}`;
      square.dataset.row = String(r);
      square.dataset.col = String(c);

      const piece = board[r][c];
      square.textContent = piece ? PIECES[piece] : "";

      if (selected && selected.r === r && selected.c === c) {
        square.classList.add("selected");
      }

      if (legalMoves.some((move) => move.r === r && move.c === c)) {
        square.classList.add("valid");
      }

      square.addEventListener("click", onSquareClick);
      boardEl.appendChild(square);
    }
  }
}

function onSquareClick(event) {
  const r = Number(event.currentTarget.dataset.row);
  const c = Number(event.currentTarget.dataset.col);
  const piece = board[r][c];

  if (selected && legalMoves.some((move) => move.r === r && move.c === c)) {
    movePiece(selected, { r, c });
    return;
  }

  if (piece && colorOf(piece) === currentTurn) {
    selected = { r, c };
    legalMoves = getLegalMoves(r, c);
  } else {
    selected = null;
    legalMoves = [];
  }

  renderBoard();
}

function movePiece(from, to) {
  board[to.r][to.c] = board[from.r][from.c];
  board[from.r][from.c] = null;

  const movedPiece = board[to.r][to.c];
  if (movedPiece[1] === "p" && (to.r === 0 || to.r === 7)) {
    board[to.r][to.c] = `${movedPiece[0]}q`;
  }

  selected = null;
  legalMoves = [];
  currentTurn = currentTurn === WHITE ? BLACK : WHITE;

  if (isKingCaptured(currentTurn)) {
    statusEl.textContent = `${currentTurn === WHITE ? "Black" : "White"} wins by capture!`;
  } else {
    statusEl.textContent = `${currentTurn === WHITE ? "White" : "Black"} to move`;
  }

  renderBoard();
}

function isKingCaptured(turn) {
  const kingCode = `${turn}k`;
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (board[r][c] === kingCode) {
        return false;
      }
    }
  }
  return true;
}

function addSlidingMoves(r, c, directions, moves) {
  const pieceColor = colorOf(board[r][c]);

  for (const [dr, dc] of directions) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push({ r: nr, c: nc });
      } else {
        if (colorOf(target) !== pieceColor) {
          moves.push({ r: nr, c: nc });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
}

function getLegalMoves(r, c) {
  const piece = board[r][c];
  if (!piece) return [];

  const pieceColor = colorOf(piece);
  const type = piece[1];
  const moves = [];

  if (type === "p") {
    const dir = pieceColor === WHITE ? -1 : 1;
    const startRow = pieceColor === WHITE ? 6 : 1;
    const oneStep = r + dir;

    if (inBounds(oneStep, c) && !board[oneStep][c]) {
      moves.push({ r: oneStep, c });
      const twoStep = r + dir * 2;
      if (r === startRow && !board[twoStep][c]) {
        moves.push({ r: twoStep, c });
      }
    }

    for (const dc of [-1, 1]) {
      const nr = r + dir;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const target = board[nr][nc];
      if (target && colorOf(target) !== pieceColor) {
        moves.push({ r: nr, c: nc });
      }
    }
  }

  if (type === "r") {
    addSlidingMoves(r, c, [[1, 0], [-1, 0], [0, 1], [0, -1]], moves);
  }

  if (type === "b") {
    addSlidingMoves(r, c, [[1, 1], [1, -1], [-1, 1], [-1, -1]], moves);
  }

  if (type === "q") {
    addSlidingMoves(
      r,
      c,
      [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
      moves
    );
  }

  if (type === "n") {
    const jumps = [
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
    ];

    for (const [dr, dc] of jumps) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const target = board[nr][nc];
      if (!target || colorOf(target) !== pieceColor) {
        moves.push({ r: nr, c: nc });
      }
    }
  }

  if (type === "k") {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        const target = board[nr][nc];
        if (!target || colorOf(target) !== pieceColor) {
          moves.push({ r: nr, c: nc });
        }
      }
    }
  }

  return moves;
}

function resetGame() {
  board = createInitialBoard();
  currentTurn = WHITE;
  selected = null;
  legalMoves = [];
  statusEl.textContent = "White to move";
  renderBoard();
}

resetBtn.addEventListener("click", resetGame);
resetGame();
