import { snippets } from "@api/db/schema.js";
import { and, eq, like, or } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const RequestQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

export const listSnippets = async (
  request: FastifyRequest,
  reply: FastifyReply,
  db: LibSQLDatabase,
) => {
  const currentUserId = request.session.user.id;

  const { page, limit, userId, isPublic, tag, search } =
    RequestQuerySchema.parse(request.query);

  const conditions = [];

  const targetUserId = userId ?? currentUserId;
  const isOwnSnippets = targetUserId === currentUserId;

  // Users can filter their own snippets, but other users only expose public snippets.
  if (isOwnSnippets) {
    conditions.push(eq(snippets.userId, currentUserId));
    if (isPublic !== undefined) {
      conditions.push(eq(snippets.isPublic, isPublic === true));
    }
  } else {
    conditions.push(eq(snippets.userId, targetUserId));
    conditions.push(eq(snippets.isPublic, true));
  }

  if (tag) {
    conditions.push(like(snippets.tags, `%"${tag}"%`));
  }

  if (search) {
    const searchPattern = `%${search}%`;
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

  return reply.status(200).send({ data: rows, total, page, limit });
};
