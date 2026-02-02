import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: "laxmiakanksha",
  host: "localhost",
  database: "4-in-a-row",
  port: 5432,
});
