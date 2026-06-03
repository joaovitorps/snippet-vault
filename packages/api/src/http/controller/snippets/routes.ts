import { db as defaultDb } from "@api/db";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { FastifyInstance } from "fastify";
import { createSnippet } from "./create.js";
import { deleteSnippet } from "./delete.js";
import { getSnippet } from "./get.js";
import { listSnippets } from "./list.js";
import { updateSnippet } from "./update.js";

export const snippetsRoutes = (
  app: FastifyInstance,
  opts?: { db?: LibSQLDatabase },
) => {
  const db = opts?.db ?? defaultDb;

  app.addHook("onRequest", app.requireAuth);

  app.post(
    "/api/snippets",
    async (request, reply) => await createSnippet(request, reply, db),
  );

  app.get(
    "/api/snippets",
    async (request, reply) => await listSnippets(request, reply, db),
  );

  app.get(
    "/api/snippets/:id",
    async (request, reply) => await getSnippet(request, reply, db),
  );

  app.put(
    "/api/snippets/:id",
    async (request, reply) => await updateSnippet(request, reply, db),
  );

  app.delete(
    "/api/snippets/:id",
    async (request, reply) => await deleteSnippet(request, reply, db),
  );
};
