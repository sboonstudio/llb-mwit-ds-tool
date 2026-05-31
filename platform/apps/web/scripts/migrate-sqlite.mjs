import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

function sqlitePathFromUrl(databaseUrl) {
  const url = databaseUrl || "file:./prisma/dev.db";

  if (!url.startsWith("file:")) {
    throw new Error(`Only SQLite file URLs are supported: ${url}`);
  }

  const filePath = decodeURIComponent(url.slice("file:".length));
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function ensureMigrationsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count" INTEGER UNSIGNED NOT NULL DEFAULT 0
    );
  `);
}

const databasePath = sqlitePathFromUrl(process.env.DATABASE_URL);
const migrationsPath = path.resolve(process.cwd(), "prisma", "migrations");

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
ensureMigrationsTable(db);

const applied = new Set(
  db.prepare('SELECT "migration_name" FROM "_prisma_migrations"').all().map(
    (row) => row.migration_name
  )
);

const migrationDirs = fs
  .readdirSync(migrationsPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const applyMigration = db.transaction((migrationName, migrationSql) => {
  db.exec(migrationSql);

  db.prepare(`
    INSERT INTO "_prisma_migrations"
      ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "applied_steps_count")
    VALUES
      (?, ?, ?, ?, NULL, NULL, ?)
  `).run(
    crypto.randomUUID(),
    crypto.createHash("sha256").update(migrationSql).digest("hex"),
    new Date().toISOString(),
    migrationName,
    1
  );
});

for (const migrationName of migrationDirs) {
  if (applied.has(migrationName)) {
    continue;
  }

  const migrationFile = path.join(migrationsPath, migrationName, "migration.sql");
  const migrationSql = fs.readFileSync(migrationFile, "utf8");
  applyMigration(migrationName, migrationSql);
  console.log(`Applied SQLite migration: ${migrationName}`);
}

db.close();
