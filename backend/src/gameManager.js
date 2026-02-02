const ROWS = 6;
const COLS = 7;

export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function dropDisc(board, col, player) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      board[r][col] = player;
      return r;
    }
  }
  return -1;
}

export function checkWin(board, player) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        let count = 0;
        for (let k = 0; k < 4; k++) {
          const nr = r + dr * k;
          const nc = c + dc * k;
          if (
            nr >= 0 && nr < ROWS &&
            nc >= 0 && nc < COLS &&
            board[nr][nc] === player
          ) count++;
        }
        if (count === 4) return true;
      }
    }
  }
  return false;
}

export function canWinNextMove(board, col, player) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) {
      board[r][col] = player;
      const win = checkWin(board, player);
      board[r][col] = null;
      return win;
    }
  }
  return false;
}
