import { randomUUID } from "node:crypto";
import { eq, and, like, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { db as defaultDb } from "../db/index.js";
import { snippets } from "../db/schema.js";

export async function snippetRoutes(
  app: FastifyInstance,
  opts: { db?: LibSQLDatabase } = {},
) {
  const db = opts.db ?? defaultDb;
  // GET /api/snippets — List with pagination, userId, public, tag, search
  app.get(
    "/api/snippets",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            userId: { type: "string" },
            public: { type: "string", enum: ["true", "false"] },
            tag: { type: "string" },
            search: { type: "string" },
          },
        },
      },
      preHandler: [app.requireAuth],
    },
    async (request) => {
      const currentUserId = request.session!.user.id;

      const query = request.query as {
        page?: string;
        limit?: string;
        userId?: string;
        public?: "true" | "false";
        tag?: string;
        search?: string;
      };

      const page = Math.max(1, parseInt(query.page ?? "1", 10));
      const limit = Math.min(
        100,
        Math.max(1, parseInt(query.limit ?? "20", 10)),
      );

      const conditions = [];

      // Determine userId scope
      const targetUserId = query.userId ?? currentUserId;
      const isOwnSnippets = targetUserId === currentUserId;

      if (isOwnSnippets) {
        // Own snippets: apply public filter if provided
        conditions.push(eq(snippets.userId, currentUserId));
        if (query.public !== undefined) {
          conditions.push(eq(snippets.isPublic, query.public === "true"));
        }
      } else {
        // Other user: only show their public snippets
        conditions.push(eq(snippets.userId, targetUserId));
        conditions.push(eq(snippets.isPublic, true));
      }

      if (query.tag) {
        conditions.push(like(snippets.tags, `%"${query.tag}"%`));
      }

      if (query.search) {
        const searchPattern = `%${query.search}%`;
        conditions.push(
          or(
            like(snippets.title, searchPattern),
            like(snippets.code, searchPattern),
            like(snippets.description, searchPattern),
          ),
        );
      }

      const where = and(...conditions);

      const total = await db.$count(snippets, where);

      const rows = await db
        .select()
        .from(snippets)
        .where(where)
        .orderBy(snippets.updatedAt)
        .limit(limit)
        .offset((page - 1) * limit);

      return { data: rows, total, page, limit };
    },
  );

  // POST /api/snippets — Create
  app.post(
    "/api/snippets",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 1, maxLength: 200 },
            code: { type: "string", minLength: 1 },
            language: { type: "string", minLength: 1, maxLength: 50 },
            description: { type: "string", maxLength: 2000 },
            tags: {
              type: "array",
              items: { type: "string", maxLength: 50 },
              maxItems: 10,
            },
            isPublic: { type: "boolean" },
          },
          required: ["title", "code", "language"],
        },
      },
      preHandler: [app.requireAuth],
    },
    async (request, reply) => {
      const userId = request.session!.user.id;

      const body = request.body as {
        title: string;
        code: string;
        language: string;
        description?: string;
        tags?: string[];
        isPublic?: boolean;
      };

      const now = new Date().toISOString();
      const id = randomUUID();
      const shareId = randomUUID();

      const [snippet] = await db
        .insert(snippets)
        .values({
          id,
          userId,
          title: body.title,
          code: body.code,
          language: body.language,
          description: body.description ?? "",
          tags: body.tags ?? [],
          isPublic: body.isPublic ?? false,
          shareId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      reply.status(201);
      return snippet;
    },
  );

  // GET /api/snippets/:id — Read single
  app.get(
    "/api/snippets/:id",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [snippet] = await db
        .select()
        .from(snippets)
        .where(eq(snippets.id, id));

      if (!snippet) {
        return reply.status(404).send({ error: "Snippet not found" });
      }

      return snippet;
    },
  );

  // PUT /api/snippets/:id — Update
  app.put(
    "/api/snippets/:id",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            title: { type: "string", minLength: 1, maxLength: 200 },
            code: { type: "string", minLength: 1 },
            language: { type: "string", minLength: 1, maxLength: 50 },
            description: { type: "string", maxLength: 2000 },
            tags: {
              type: "array",
              items: { type: "string", maxLength: 50 },
              maxItems: 10,
            },
            isPublic: { type: "boolean" },
          },
        },
      },
      preHandler: [app.requireAuth],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.session!.user.id;

      const [existing] = await db
        .select({ userId: snippets.userId })
        .from(snippets)
        .where(eq(snippets.id, id));

      if (!existing) {
        return reply.status(404).send({ error: "Snippet not found" });
      }

      if (existing.userId !== userId) {
        return reply.status(403).send({ error: "You do not own this snippet" });
      }

      const body = request.body as {
        title?: string;
        code?: string;
        language?: string;
        description?: string;
        tags?: string[];
        isPublic?: boolean;
      };

      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        ...body,
        updatedAt: now,
      };

      if (body.isPublic === true) {
        const [current] = await db
          .select({ shareId: snippets.shareId })
          .from(snippets)
          .where(eq(snippets.id, id));
        if (!current?.shareId) {
          updateData.shareId = randomUUID();
        }
      }

      const [updated] = await db
        .update(snippets)
        .set(updateData)
        .where(eq(snippets.id, id))
        .returning();

      return updated;
    },
  );

  // DELETE /api/snippets/:id — Delete
  app.delete(
    "/api/snippets/:id",
    { preHandler: [app.requireAuth] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.session!.user.id;

      const [existing] = await db
        .select({ userId: snippets.userId })
        .from(snippets)
        .where(eq(snippets.id, id));

      if (!existing) {
        return reply.status(404).send({ error: "Snippet not found" });
      }

      if (existing.userId !== userId) {
        return reply.status(403).send({ error: "You do not own this snippet" });
      }

      await db.delete(snippets).where(eq(snippets.id, id));

      reply.status(204);
    },
  );
}
