CREATE TABLE games (
    id UUID PRIMARY KEY,
    player1 TEXT,
    player2 TEXT,
    winner TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE TABLE leaderboard (
    username TEXT PRIMARY KEY,
    wins INT DEFAULT 0
);
s