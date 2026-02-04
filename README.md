# 4-in-a-Row (Connect Four) – Real-Time Multiplayer Game

A real-time, backend-driven implementation of the classic Connect Four (4-in-a-Row) game.
Players can play 1v1 against another user or against a competitive bot if no opponent joins within a timeout.

Built with Node.js, WebSockets, React, and PostgreSQL.

--------------------------------------------------

FEATURES

- Real-time multiplayer gameplay using WebSockets
- Competitive bot fallback if no opponent joins within 10 seconds
- Reconnect to the same game within 30 seconds after disconnect
- Strategic bot (tries to win, blocks opponent, avoids traps)
- Persistent leaderboard using PostgreSQL
- Restart game after completion
- Simple and clean frontend UI

--------------------------------------------------

TECH STACK

Backend:
- Node.js
- Express
- WebSocket (ws)
- PostgreSQL

Frontend:
- React (Vite)
- WebSocket API
- Plain CSS

--------------------------------------------------

PROJECT STRUCTURE

4-in-a-row/
  backend/
    src/
      index.js        - WebSocket + REST server
      gameManager.js - Game rules and win logic
      bot.js         - Competitive bot logic
      db.js          - PostgreSQL connection
    package.json

  frontend/
    src/
      Game.jsx
      Leaderboard.jsx
      App.jsx
      style.css
    package.json

  README.md

--------------------------------------------------

GAME RULES

- Board size: 7 columns x 6 rows
- Players take turns dropping discs
- First player to connect 4 discs vertically, horizontally, or diagonally wins
- If the board fills completely with no winner, the game ends in a draw

--------------------------------------------------

BOT STRATEGY

The bot is deterministic (non-random) and follows this priority:

1. Play a winning move if available
2. Block the opponent’s immediate winning move
3. Avoid moves that allow the opponent to win next turn
4. Prefer the center column
5. Deterministic fallback move

--------------------------------------------------

DISCONNECT AND RECONNECT HANDLING

- If a player disconnects, the game state is preserved in memory
- The player can rejoin within 30 seconds using the same username
- If the player does not reconnect within 30 seconds:
  - The game is forfeited
  - The opponent or bot is declared the winner

--------------------------------------------------

GAME STATE HANDLING

- Active games are stored in memory for fast real-time updates
- Completed games update a persistent leaderboard in PostgreSQL

--------------------------------------------------

LEADERBOARD

- Tracks total number of wins per player
- Data persists across server restarts
- Displayed on the frontend via a REST API

--------------------------------------------------

SETUP INSTRUCTIONS

Prerequisites:
- Node.js (v18 or higher)
- PostgreSQL

Clone the repository:

  git clone <your-repo-url>
  cd 4-in-a-row

Backend setup:

  cd backend
  npm install
  npm start

Backend runs on:
  http://localhost:3001

Frontend setup:

  cd frontend
  npm install
  npm run dev

Frontend runs on:
  http://localhost:5173

Database setup:

Create database:
  CREATE DATABASE "4-in-a-row";

Create leaderboard table:
  CREATE TABLE leaderboard (
    username TEXT PRIMARY KEY,
    wins INTEGER NOT NULL
  );

--------------------------------------------------

APPLICATION HOSTING

The application is fully functional when run locally using the setup instructions above,
including real-time multiplayer gameplay, bot fallback, reconnection handling, and a
persistent PostgreSQL-backed leaderboard.

The backend has also been deployed on cloud platforms such as Render for validation.
On free-tier hosting, PostgreSQL requires separate managed database provisioning and
schema migration. Since this is an infrastructure concern and independent of core game
logic, the project is documented and demonstrated primarily via local execution.



--------------------------------------------------

DESIGN HIGHLIGHTS

- Server-authoritative turn handling
- Stateless frontend driven entirely by server events
- Clean separation of concerns (game logic, networking, persistence)
- Deterministic and testable game logic

--------------------------------------------------

FUTURE IMPROVEMENTS

- Store full game history
- Highlight winning four discs
- Matchmaking lobby UI
- Player authentication
- Kafka-based analytics pipeline

--------------------------------------------------

