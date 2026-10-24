import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, renameSync, rmdirSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { after, before, test } from "node:test";
import { requestSchema, rewardLimitMessage, validateRequest } from "../lib/validation.ts";

const valid = { contactPerson: "Анна-Мария", phone: "79991234567", reward: "15000" };
const invalidCases = [
  ["contactPerson", "А"], ["contactPerson", "А".repeat(21)],
  ["contactPerson", "Иван2"], ["contactPerson", "Иван!"],
  ["contactPerson", "Иван\tИван"], ["contactPerson", " — "],
  ["contactPerson", "   "], ["contactPerson", null],
  ["phone", "69991234567"], ["phone", "7999123456"],
  ["phone", "799912345678"], ["phone", "+79991234567"],
  ["phone", "7999 1234567"], ["phone", "7999123456а"], ["phone", 79991234567],
  ["reward", "10000000"], ["reward", "-1"], ["reward", "деньги"],
  ["reward", "1e5"], ["reward", "NaN"], ["reward", ""], ["reward", "   "],
];

test("schema accepts boundary values, names with letters, spaces and dashes", () => {
  for (const name of ["Ан", "А".repeat(20), "Анна Мария", "Анна–Мария", "Анна—Мария", "  Анна  "]) {
    assert.equal(requestSchema.safeParse({ ...valid, contactPerson: name }).success, true, name);
  }
  for (const phone of ["79991234567", "89991234567"]) {
    assert.equal(requestSchema.safeParse({ ...valid, phone }).success, true);
  }
  for (const reward of ["0", "9999999", "1234,50", "1234.50"]) {
    assert.equal(requestSchema.safeParse({ ...valid, reward }).success, true);
  }
  assert.equal(requestSchema.parse({ ...valid, reward: "1234,50" }).reward, 1234.5);
  assert.equal(requestSchema.parse({ ...valid, contactPerson: "  Анна  " }).contactPerson, "Анна");
});

test("schema rejects invalid fields and reports the reward discussion hint", () => {
  for (const [field, value] of invalidCases) {
    assert.equal(requestSchema.safeParse({ ...valid, [field]: value }).success, false, `${field}: ${value}`);
  }
  assert.equal(validateRequest({ ...valid, reward: "10000000" }).reward, rewardLimitMessage);
  for (const value of [null, [], {}, { ...valid, created_at: "2000-01-01" }]) {
    assert.equal(requestSchema.safeParse(value).success, false);
  }
});

const directory = mkdtempSync(join(tmpdir(), "find-picture-api-test-"));
const databasePath = join(directory, "requests.sqlite");
let server;
let baseUrl;

async function startServer() {
  const portProbe = createServer();
  await new Promise((resolve) => portProbe.listen(0, "127.0.0.1", resolve));
  const port = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(), env: { ...process.env, SQLITE_PATH: databasePath },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let output = "";
  server.stdout.on("data", (data) => { output += data; });
  server.stderr.on("data", (data) => { output += data; });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(output);
    try { if ((await fetch(baseUrl)).ok) return; } catch { /* Server is starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Next.js did not start: ${output}`);
}

async function stopServer() {
  if (server && server.exitCode === null) {
    const stopped = new Promise((resolve) => server.once("exit", resolve));
    server.kill();
    await stopped;
  }
}

function rows() {
  const db = new DatabaseSync(databasePath, { readOnly: true });
  try { return db.prepare("SELECT * FROM requests ORDER BY id").all(); }
  finally { db.close(); }
}

function post(body) {
  return fetch(`${baseUrl}/api/requests`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

before(startServer);
after(async () => {
  await stopServer();
  assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
  rmSync(directory, { recursive: true, force: true });
});

test("API saves only valid requests, timestamps them and preserves them after restart", async () => {
  // These are direct HTTP requests to a separate Next.js process, without a browser.
  assert.equal((await post({ ...valid, contactPerson: "А" })).status, 400);
  assert.equal(existsSync(databasePath), false, "Invalid first request must not create a database");
  const startedAt = Date.now();
  const response = await post(valid);
  assert.equal(response.status, 201);
  assert.deepEqual(Object.keys(await response.json()), ["message"]);
  const saved = rows();
  assert.equal(saved.length, 1);
  assert.equal(saved[0].contact_person, valid.contactPerson);
  assert.equal(saved[0].phone, valid.phone);
  assert.equal(saved[0].reward, 15000);
  assert.match(saved[0].created_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.ok(Date.parse(saved[0].created_at) >= startedAt - 1000);
  assert.ok(Date.parse(saved[0].created_at) <= Date.now());

  for (const [field, value] of invalidCases) {
    const response = await post({ ...valid, [field]: value });
    assert.equal(response.status, 400, `${field}: ${value}`);
    assert.ok((await response.json()).errors[field]);
    assert.deepEqual(rows(), saved, "Each invalid request must leave the database unchanged");
  }
  const unexpectedFields = ["id", "created_at", "email", "message", "isAdmin"];
  const missingFields = Object.keys(valid).map((field) => {
    const body = { ...valid };
    delete body[field];
    return body;
  });
  for (const body of [null, [], {}, ...missingFields, ...unexpectedFields.map((field) => ({ ...valid, [field]: "unexpected" }))]) {
    assert.equal((await post(body)).status, 400);
    assert.deepEqual(rows(), saved, "Extra or missing fields must not insert or modify rows");
  }
  assert.equal((await fetch(`${baseUrl}/api/requests`, { method: "POST", body: "{broken" })).status, 400);
  assert.equal((await fetch(`${baseUrl}/api/requests`)).status, 405);
  assert.equal(rows().length, 1, "Rejected requests must not insert rows");

  await stopServer();
  await startServer();
  assert.deepEqual(rows(), saved);
  assert.equal((await post({ ...valid, phone: "89991234567", reward: "0" })).status, 201);
  assert.equal(rows()[1].reward, 0);

  const viewed = spawnSync(process.execPath, ["scripts/view-requests.mjs"], {
    cwd: process.cwd(), env: { ...process.env, SQLITE_PATH: databasePath }, encoding: "utf8", windowsHide: true,
  });
  assert.equal(viewed.status, 0, viewed.stderr);
  const expectedRows = rows().map((row) => [
    row.contact_person, row.phone, row.reward,
    new Date(row.created_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" }),
  ].join(" | "));
  assert.deepEqual(viewed.stdout.trim().split(/\r?\n/), [
    "Контактное лицо | телефон | сумма | дата и время добавления", ...expectedRows,
  ], "Viewer must return all rows with four columns, without IDs or database structure");
  assert.equal(rows().length, 2, "Viewer must not change the database");

  const backup = databasePath + ".backup";
  renameSync(databasePath, backup);
  mkdirSync(databasePath);
  try {
    const failed = await post(valid);
    assert.equal(failed.status, 500);
    assert.deepEqual(Object.keys(await failed.json()), ["message"]);
  } finally {
    rmdirSync(databasePath);
    renameSync(backup, databasePath);
  }
  assert.equal(rows().length, 2);
});

test("viewer handles missing and empty databases without creating records", () => {
  const missingPath = join(directory, "missing.sqlite");
  const view = (file) => spawnSync(process.execPath, ["scripts/view-requests.mjs"], {
    cwd: process.cwd(), env: { ...process.env, SQLITE_PATH: file }, encoding: "utf8", windowsHide: true,
  });
  const missing = view(missingPath);
  assert.equal(missing.status, 0, missing.stderr);
  assert.equal(missing.stdout.trim(), "Контактное лицо | телефон | сумма | дата и время добавления\nЗаписей пока нет.");
  assert.equal(existsSync(missingPath), false, "Viewer must not create a missing database");

  const emptyPath = join(directory, "empty.sqlite");
  const emptyDb = new DatabaseSync(emptyPath);
  try {
    emptyDb.exec("CREATE TABLE requests (id INTEGER PRIMARY KEY, contact_person TEXT, phone TEXT, reward REAL, created_at TEXT)");
  } finally {
    emptyDb.close();
  }
  const empty = view(emptyPath);
  assert.equal(empty.status, 0, empty.stderr);
  assert.equal(empty.stdout, missing.stdout);

  const fixtureDb = new DatabaseSync(emptyPath);
  try {
    fixtureDb.prepare("INSERT INTO requests VALUES (?, ?, ?, ?, ?)")
      .run(999, "Анна", "79991234567", 15000, "2026-10-25T09:15:30.123Z");
  } finally {
    fixtureDb.close();
  }
  assert.equal(view(emptyPath).stdout.trim(),
    "Контактное лицо | телефон | сумма | дата и время добавления\nАнна | 79991234567 | 15000 | 25.10.2026, 12:15:30");

  const unreadable = view(directory);
  assert.equal(unreadable.status, 1);
  assert.equal(unreadable.stdout, "");
  assert.match(unreadable.stderr, /Не удалось прочитать обращения/);
});
