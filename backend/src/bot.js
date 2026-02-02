import { dropDisc, canWinNextMove } from "./gameManager.js";

const COLS = 7;
const BOT = "bot";

function clone(board) {
  return board.map(r => [...r]);
}

function getValidColumns(board) {
  const cols = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) cols.push(c);
  }
  return cols;
}

export function botMove(board, opponent) {
  const valid = getValidColumns(board);

  for (const c of valid)
    if (canWinNextMove(board, c, BOT)) return c;

  for (const c of valid)
    if (canWinNextMove(board, c, opponent)) return c;

  const safe = valid.filter(c => {
    const tmp = clone(board);
    dropDisc(tmp, c, BOT);
    return !getValidColumns(tmp).some(oc =>
      canWinNextMove(tmp, oc, opponent)
    );
  });

  const choices = safe.length ? safe : valid;
  const center = Math.floor(COLS / 2);
  if (choices.includes(center)) return center;

  return choices[0];
}
