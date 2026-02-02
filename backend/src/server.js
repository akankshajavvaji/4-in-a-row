const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const { createGame: createGameState } = require("./game/gameState");
const { dropDisc } = require("./game/moves");
const { checkWinner } = require("./game/winCheck");
const games = require("./game/activeGames");
const registerQueueHandlers = require("./matchmaking/queue");
const { findBestMove } = require("./bot/botLogic");
const reconnect = require("./game/reconnect");

const leaderboardDB = require("./db/leaderboard");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

/* ------------------ SERVER + SOCKET ------------------ */

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // 👇 ONLY matchmaking here
  registerQueueHandlers(io, socket);

  /* ---------- PLAYER MOVE ---------- */
  socket.on("make_move", async ({ gameId, column }) => {
    const game = games.getGame(gameId);
    if (!game || game.winner !== null) return;

    const playerIndex = game.players.indexOf(socket.username);
    if (playerIndex !== game.currentTurn) return;

    const move = dropDisc(game.board, column, playerIndex);
    if (!move) return;

    game.moves++;

    if (checkWinner(game.board, playerIndex)) {
      game.winner = playerIndex;
    } else if (game.moves === 42) {
      game.winner = "DRAW";
    } else {
      game.currentTurn = 1 - game.currentTurn;
    }

    if (game.winner !== null && game.winner !== "DRAW" && !game.saved) {
      const winner = game.players[game.winner];
      await leaderboardDB.ensurePlayer(winner);
      await leaderboardDB.recordWin(winner);
      await db.query(
        "INSERT INTO games (id, winner) VALUES ($1, $2)",
        [gameId, winner]
      );
      game.saved = true;
    }

    io.to(gameId).emit("game_update", {
      board: game.board,
      currentTurn: game.currentTurn,
      winner: game.winner,
    });

    /* ---------- BOT MOVE ---------- */
    if (game.isBotGame && game.winner === null && game.currentTurn === 1) {
      setTimeout(() => {
        const botCol = findBestMove(game.board);
        if (botCol === null) return;

        dropDisc(game.board, botCol, 1);
        game.moves++;

        if (checkWinner(game.board, 1)) {
          game.winner = 1;
        } else if (game.moves === 42) {
          game.winner = "DRAW";
        } else {
          game.currentTurn = 0;
        }

        io.to(gameId).emit("game_update", {
          board: game.board,
          currentTurn: game.currentTurn,
          winner: game.winner,
        });
      }, 500);
    }
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    if (!socket.gameId) return;

    const game = games.getGame(socket.gameId);
    if (!game || game.winner !== null) return;

    const idx = game.players.indexOf(socket.username);

    reconnect.startForfeitTimer(socket.gameId, idx, () => {
      game.winner = 1 - idx;

      io.to(socket.gameId).emit("game_update", {
        board: game.board,
        winner: game.winner,
        forfeited: true,
      });

      games.removeGame(socket.gameId);
    });
  });

  /* ---------- REJOIN GAME ---------- */
  socket.on("rejoin_game", ({ gameId, username }) => {
    const game = games.getGame(gameId);
    if (!game) return;

    const idx = game.players.indexOf(username);
    if (idx === -1) return;

    socket.username = username;
    socket.gameId = gameId;
    socket.join(gameId);

    reconnect.cancelForfeitTimer(gameId, idx);

    socket.emit("game_update", {
      board: game.board,
      currentTurn: game.currentTurn,
      winner: game.winner,
    });
  });
});

/* ------------------ REST APIs ------------------ */

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/leaderboard", async (req, res) => {
  const data = await leaderboardDB.getLeaderboard();
  res.json(data);
});

server.listen(3001, () => {
  console.log("Backend running on port 3001");
});
