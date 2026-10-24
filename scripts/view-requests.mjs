import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.env.SQLITE_PATH || "data/requests.sqlite");

try {
  if (!existsSync(databasePath)) {
    console.log("[]");
  } else {
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const records = database.prepare(`
        SELECT contact_person AS "Контактное лицо",
               phone AS "Телефон для связи",
               reward AS "Вознаграждение за наводку"
        FROM requests ORDER BY id
      `).all();
      console.log(JSON.stringify(records, null, 2));
    } finally {
      database.close();
    }
  }
} catch {
  console.error("Не удалось прочитать обращения. Проверьте путь SQLITE_PATH и доступ к базе.");
  process.exitCode = 1;
}
