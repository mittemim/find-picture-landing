import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = resolve(process.env.SQLITE_PATH || "data/requests.sqlite");

function printRecords(records) {
  console.log("Контактное лицо | телефон | сумма | дата и время добавления");
  if (records.length === 0) console.log("Записей пока нет.");
  for (const record of records) {
    const addedAt = new Date(record.created_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });
    console.log(`${record.contact_person} | ${record.phone} | ${record.reward} | ${addedAt}`);
  }
}

try {
  if (!existsSync(databasePath)) {
    printRecords([]);
  } else {
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const records = database.prepare(`
        SELECT contact_person, phone, reward, created_at
        FROM requests ORDER BY id
      `).all();
      printRecords(records);
    } finally {
      database.close();
    }
  }
} catch {
  console.error("Не удалось прочитать обращения. Проверьте путь SQLITE_PATH и доступ к базе.");
  process.exitCode = 1;
}
