import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";

import { pool } from "./db.js";
import { createBoard, dropDisc, checkWin } from "./gameManager.js";
import { botMove } from "./bot.js";

/* ---------------- App & Server ---------------- */

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({ origin: "http://localhost:5173" }));

/* ---------------- REST API ---------------- */

app.get("/leaderboard", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT username, wins FROM leaderboard ORDER BY wins DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Leaderboard error:", err.message);
    res.status(500).json([]);
  }
});

/* ---------------- Game State ---------------- */

const waitingQueue = [];
const games = new Map();

/* ---------------- WebSocket Logic ---------------- */

wss.on("connection", (ws) => {
  console.log("🟢 Client connected");

  ws.on("message", async (raw) => {
    const data = JSON.parse(raw.toString());

    /* ----- JOIN ----- */
   if (data.type === "join") {
  ws.username = data.username;

  // 🔁 RECONNECT LOGIC
  for (const game of games.values()) {
    if (
      game.disconnected[ws.username]
    ) {
      // Cancel forfeit timer
      clearTimeout(game.disconnectTimers[ws.username]);
      delete game.disconnectTimers[ws.username];
      delete game.disconnected[ws.username];

      // Reattach socket
      game.sockets[ws.username] = ws;
      ws.gameId = game.id;

      // Send current game state
      ws.send(JSON.stringify({
        type: "update",
        board: game.board,
        currentTurn: game.currentTurn,
        player1: game.player1,
        player2: game.player2
      }));

      console.log(`🔁 ${ws.username} reconnected`);
      return;
    }
  }

  // Normal matchmaking
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


    /* ----- MOVE ----- */
    if (data.type === "move") {
      const game = games.get(ws.gameId);
      if (!game) return;

      // Enforce turn by username
      if (game.currentTurn !== ws.username) return;

      dropDisc(game.board, data.col, ws.username);

      // Human win
      if (checkWin(game.board, ws.username)) {
        broadcast(game, {
          type: "end",
          board: game.board,
          winner: ws.username
        });
        await saveWin(ws.username);
        games.delete(game.id);
        return;
      }

      // Switch turn
      game.currentTurn =
        ws.username === game.player1
          ? game.player2
          : game.player1;

    broadcast(game, {
  type: "update",
  board: game.board,
  currentTurn: game.currentTurn,
  player1: game.player1,
  player2: game.player2
});


      // Bot move
      if (game.bot && game.currentTurn === "bot") {
        const col = botMove(game.board, game.player1);
        dropDisc(game.board, col, "bot");

        if (checkWin(game.board, "bot")) {
          broadcast(game, {
            type: "end",
            board: game.board,
            winner: "bot"
          });
          await saveWin("bot");
          games.delete(game.id);
          return;
        }

        game.currentTurn = game.player1;

        broadcast(game, {
  type: "update",
  board: game.board,
  currentTurn: game.currentTurn,
  player1: game.player1,
  player2: game.player2
});

      }
    }
  });

  ws.on("close", () => {
  console.log(`🔴 ${ws.username} disconnected`);

  // Remove from waiting queue if needed
  const idx = waitingQueue.indexOf(ws);
  if (idx !== -1) waitingQueue.splice(idx, 1);

  // Handle active game disconnect
  const game = games.get(ws.gameId);
  if (!game) return;

  // Mark disconnected
  game.disconnected[ws.username] = true;

  // Start 30s forfeit timer
  game.disconnectTimers[ws.username] = setTimeout(async () => {
    console.log(`⏱️ ${ws.username} did not reconnect — forfeiting`);

    const winner =
      ws.username === game.player1
        ? game.player2
        : game.player1;

    broadcast(game, {
      type: "end",
      board: game.board,
      winner
    });

    await saveWin(winner);
    games.delete(game.id);
  }, 30000);
});

});

/* ---------------- Helpers ---------------- */

function startGame(p1, p2) {
 const game = {
  id: uuid(),
  board: createBoard(),
  player1: p1.username,
  player2: p2.username,
  currentTurn: p1.username,
  sockets: {
    [p1.username]: p1,
    [p2.username]: p2
  },
  disconnected: {},       
  disconnectTimers: {}    
};


  games.set(game.id, game);
  p1.gameId = p2.gameId = game.id;

 broadcast(game, {
  type: "update",
  board: game.board,
  currentTurn: game.currentTurn,
  player1: game.player1,
  player2: game.player2
});

}


function startBotGame(player) {
  const game = {
    id: uuid(),
    board: createBoard(),
    player1: player.username,
    player2: "bot",
    currentTurn: player.username,
    bot: true,
    sockets: {
      [player.username]: player
    },
    disconnected: {},       
  disconnectTimers: {}  
  };

  games.set(game.id, game);
  player.gameId = game.id;
player.send(JSON.stringify({
  type: "start",
  board: game.board,
  currentTurn: game.currentTurn,
  player1: game.player1,
  player2: "bot",
  bot: true
}));

}

function broadcast(game, message) {
  Object.values(game.sockets).forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  });
}

/* ---------------- DB Helper ---------------- */

async function saveWin(username) {
  try {
    await pool.query(
      `INSERT INTO leaderboard(username, wins)
       VALUES ($1, 1)
       ON CONFLICT (username)
       DO UPDATE SET wins = leaderboard.wins + 1`,
      [username]
    );
  } catch (err) {
    console.error("saveWin error:", err.message);
  }
}

/* ---------------- Start Server ---------------- */

server.listen(3001, () => {
  console.log("🚀 Backend running on http://localhost:3001");
});
