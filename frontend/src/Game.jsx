import { useEffect, useRef, useState } from "react";

export default function Game({ username, onRestart, onGameEnd }) {
  const wsRef = useRef(null);

  const [board, setBoard] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const [gameOver, setGameOver] = useState(false);
  const [myTurn, setMyTurn] = useState(false);

  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:3001");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", username }));
      setStatus("Waiting for opponent...");
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "start" || data.type === "update") {
        setBoard(data.board);
        setPlayer1(data.player1);
        setPlayer2(data.player2);

        setMyTurn(data.currentTurn === username);
        setStatus(
          data.currentTurn === username
            ? "Your turn"
            : "Opponent's turn"
        );
      }

      if (data.type === "end") {
        setBoard(data.board);
        setGameOver(true);
        setMyTurn(false);
        setStatus(`Winner: ${data.winner}`);
        onGameEnd?.();
      }
    };

    return () => ws.close();
  }, [username]);

  function move(col) {
    if (!myTurn || gameOver) return;
    wsRef.current.send(JSON.stringify({ type: "move", col }));
  }

  function cellClass(cell) {
    if (!cell) return "cell";
    if (cell === "bot") return "cell bot";
    if (cell === player1) return "cell p1";
    if (cell === player2) return "cell p2";
    return "cell";
  }

  return (
    <div>
      <div className="status">{status}</div>

      <div className="board">
        {board.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => (
              <div
                key={c}
                className={cellClass(cell)}
                onClick={() => move(c)}
              />
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <button className="primary-btn" onClick={onRestart}>
          Restart
        </button>
      )}
    </div>
  );
}
