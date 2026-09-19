// One-time setup: creates all tables in your Turso database.
// Run locally after setting TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
// in a .env.local file (or as real environment variables):
//
//   npm run db:setup
//
// Safe to run more than once — every statement uses IF NOT EXISTS.
import { createClient } from "@libsql/client";
import { readFileSync, existsSync } from "node:fs";

// Minimal .env.local loader so this works with plain `node scripts/init-db.mjs`.
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("Missing TURSO_DATABASE_URL. Add it to .env.local first.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    region TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS spots (
    id TEXT PRIMARY KEY NOT NULL,
    owner TEXT NOT NULL,
    data TEXT NOT NULL,
    created INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_spots_owner ON spots (owner)`,
  `CREATE TABLE IF NOT EXISTS actions (
    user TEXT NOT NULL,
    spot TEXT NOT NULL,
    kind TEXT NOT NULL,
    created INTEGER NOT NULL,
    PRIMARY KEY (user, spot, kind)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_actions_spot ON actions (spot, kind)`,
  `CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY NOT NULL,
    user TEXT NOT NULL,
    spot TEXT NOT NULL,
    kind TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER,
    created INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_comments_spot ON comments (spot)`,
  `CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY NOT NULL,
    user TEXT NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    spots TEXT NOT NULL,
    created INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_trips_user ON trips (user)`,
  `CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY NOT NULL,
    user TEXT NOT NULL,
    spot TEXT NOT NULL,
    reason TEXT NOT NULL,
    created INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY NOT NULL,
    user TEXT NOT NULL,
    type TEXT NOT NULL
  )`,
];

for (const sql of statements) {
  await client.execute(sql);
  console.log("OK:", sql.trim().split("\n")[0]);
}
console.log("\nDatabase is ready.");
