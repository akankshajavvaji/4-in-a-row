import { useEffect, useState } from "react";

export default function Leaderboard({ refreshKey }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch("http://localhost:3001/leaderboard")
      .then(res => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then(data => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [refreshKey]); // 🔑 this is important

  return (
    <div className="leaderboard-card">
      <h3>🏆 Leaderboard</h3>

      {loading && <p>Loading...</p>}
      {error && <p>Cannot load leaderboard</p>}

      {!loading && !error && rows.length === 0 && (
        <p>No games played yet</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <ul className="leaderboard-list">
          {rows.map((r, i) => (
            <li key={r.username}>
              <span>{i + 1}. {r.username}</span>
              <strong>{r.wins}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
