import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { ValidRequest } from "./validation";

export function saveRequest(values: ValidRequest): void {
  const databasePath = resolve(process.env.SQLITE_PATH || "data/requests.sqlite");
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(`
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact_person TEXT NOT NULL,
        phone TEXT NOT NULL,
        reward REAL NOT NULL CHECK (reward >= 0),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `);
    database.prepare(`
      INSERT INTO requests (contact_person, phone, reward) VALUES (?, ?, ?)
    `).run(values.contactPerson, values.phone, values.reward);
  } finally {
    database.close();
  }
}
