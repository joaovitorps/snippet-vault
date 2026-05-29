import { test as baseTest } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { randomUUID } from "node:crypto";
import { existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { getDirname } from "../../utils/path.js";

interface Fixtures {
  db: LibSQLDatabase;
}

export const test = baseTest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, Use) => {
    const testDbPath = resolve(
      getDirname(import.meta.url),
      `../../../test-snippetvault-${randomUUID()}.db`,
    );
    const client = createClient({ url: `file:${testDbPath}` });
    const db = drizzle(client);
    await migrate(db, {
      migrationsFolder: resolve(
        getDirname(import.meta.url),
        "../../../drizzle",
      ),
    });
    await Use(db);
    client.close();
    if (existsSync(testDbPath)) unlinkSync(testDbPath);
    const walPath = `${testDbPath}-wal`;
    if (existsSync(walPath)) unlinkSync(walPath);
    const shmPath = `${testDbPath}-shm`;
    if (existsSync(shmPath)) unlinkSync(shmPath);
  },
});
