import { test as baseTest } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { randomUUID } from "node:crypto";
import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { getDirname } from "../../utils/path.js";

const __dirname = getDirname(import.meta.url);

interface Fixtures {
  db: BetterSQLite3Database;
}

export const test = baseTest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, Use) => {
    const testDbPath = resolve(
      __dirname,
      `../../../test-snippetvault-${randomUUID()}.db`,
    );
    const sqlite = new Database(testDbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    migrate(db, { migrationsFolder: resolve(__dirname, "../../../drizzle") });
    await Use(db);
    sqlite.close();
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
    const walPath = `${testDbPath}-wal`;
    if (existsSync(walPath)) unlinkSync(walPath);
    const shmPath = `${testDbPath}-shm`;
    if (existsSync(shmPath)) unlinkSync(shmPath);
  },
});
