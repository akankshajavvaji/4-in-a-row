import { WebSocketServer } from "ws";
import {
  waitingQueue,
  games,
  createBoard,
  dropDisc,
  checkWin,
  finishGame
} from "./gameManager.js";
import { v4 as uuid } from "uuid";
import { botMove } from "./bot.js";

export function setupWebSocket(server) {
  console.log("WebSocket server initializing...");
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected via WebSocket");

    ws.on("message", async (message) => {
      const data = JSON.parse(message.toString());

      if (data.type === "join") {
        ws.username = data.username;

        if (waitingQueue.length > 0) {
          const opponent = waitingQueue.shift();
          startGame(ws, opponent);
        } else {
          waitingQueue.push(ws);
          setTimeout(() => {
            if (waitingQueue.includes(ws)) {
              waitingQueue.splice(waitingQueue.indexOf(ws), 1);
              startBotGame(ws);
            }
          }, 10000);
        }
      }

      if (data.type === "move") {
        const game = games.get(ws.gameId);
        if (!game) return;

        dropDisc(game.board, data.col, ws.username);
        broadcast(game, { type: "update", board: game.board });

        if (checkWin(game.board, ws.username)) {
          broadcast(game, { type: "end", winner: ws.username });
          await finishGame(game, ws.username);
          games.delete(game.id);
        }

        if (game.bot) {
          const col = botMove(game.board);
          dropDisc(game.board, col, "bot");
          broadcast(game, { type: "update", board: game.board });

          if (checkWin(game.board, "bot")) {
            broadcast(game, { type: "end", winner: "bot" });
            await finishGame(game, "bot");
            games.delete(game.id);
          }
        }
      }
    });
  });
}

function startGame(p1, p2) {
  const game = {
    id: uuid(),
    board: createBoard(),
    player1: p1.username,
    player2: p2.username
  };
  games.set(game.id, game);
  p1.gameId = p2.gameId = game.id;

  p1.send(JSON.stringify({ type: "start", board: game.board }));
  p2.send(JSON.stringify({ type: "start", board: game.board }));
}

function startBotGame(player) {
  const game = {
    id: uuid(),
    board: createBoard(),
    player1: player.username,
    player2: "bot",
    bot: true
  };
  games.set(game.id, game);
  player.gameId = game.id;

  player.send(JSON.stringify({ type: "start", board: game.board, bot: true }));
}

function broadcast(game, msg) {
  [...waitingQueue].forEach(ws => {
    if (ws.gameId === game.id) {
      ws.send(JSON.stringify(msg));
    }
  });
}
