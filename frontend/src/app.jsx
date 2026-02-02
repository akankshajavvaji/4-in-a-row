import { useState } from "react";
import Game from "./Game";
import Leaderboard from "./Leaderboard";
import "./style.css";

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [username, setUsername] = useState("");
  const [lbRefreshKey, setLbRefreshKey] = useState(0);

  return (
    <div className="app-container">
      {screen === "welcome" && (
        <div className="card">
          <h1>🎮 4 in a Row</h1>
          <p>Play against a player or a smart bot.</p>
          <button className="primary-btn" onClick={() => setScreen("join")}>
            Let’s Start
          </button>
        </div>
      )}

      {screen === "join" && (
        <div className="card">
          <h2>Enter username</h2>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button
            className="primary-btn"
            disabled={!username}
            onClick={() => setScreen("game")}
          >
            Join Game
          </button>
        </div>
      )}

      {screen === "game" && (
        <>
          <Game
            username={username}
            onRestart={() => setScreen("join")}
            onGameEnd={() => setLbRefreshKey(k => k + 1)} // 🔥 trigger refresh
          />
          <Leaderboard refreshKey={lbRefreshKey} />
        </>
      )}
    </div>
  );
}
