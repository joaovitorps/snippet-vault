import { snippetsRoutes } from "@api/http/controller/snippets/routes.js";
import { fpAuthMiddleware } from "@api/http/middleware/auth.js";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { fastify } from "fastify";
import { resolve } from "node:path";
import { test as baseTest, vi } from "vitest";
import { z } from "zod";
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
    app.setErrorHandler((error, _, reply) => {
      if (error instanceof z.ZodError) {
        return reply
          .code(400)
          .send({ message: "Validation Error", issues: error.issues });
      }

      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      } else {
        // TODO: use sentry/datadog/graphana or any other log external tool
      }

      return reply.code(500).send({ message: "Internal Server Error" });
    });

    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/api/")) {
        return reply.code(404).send({ error: "Not found" });
      }
    });

    await app.register(fpAuthMiddleware);
    await app.register(snippetsRoutes, { db });

    await app.ready();

    onCleanup(async () => {
      await app.close();
    });

    return app;
  });
