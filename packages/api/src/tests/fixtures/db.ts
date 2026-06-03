import { snippetRoutes } from "@api/routes/snippets.js";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import fastify from "fastify";
import { resolve } from "node:path";
import { test as baseTest } from "vitest";
import authMiddleware from "../../middleware/auth.js";
import { getDirname } from "../../utils/path.js";

export const test = baseTest
  // eslint-disable-next-line no-empty-pattern
  .extend("db", async ({}, { onCleanup }) => {
    vi.stubEnv("DATABASE_URL", ":memory:");

    if (!process.env.DATABASE_URL) {
      process.exit(1);
    }

    const client = createClient({ url: `file:${process.env.DATABASE_URL}` });
    const db = drizzle(client);

    await migrate(db, {
      migrationsFolder: resolve(
        getDirname(import.meta.url),
        "../../../drizzle",
      ),
    });

    onCleanup(() => {
      client.close();
    });

    return db;
  })
  .extend("app", async ({ db }, { onCleanup }) => {
    const app = fastify();

    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    onCleanup(async () => {
      await app.close();
    });

    return app;
  });
