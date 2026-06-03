import { snippets } from "@api/db/schema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const requestBodySchema = z.object({
  title: z.string().min(1).max(200),
  code: z.string().min(1),
  language: z.string().min(1).max(50),
  description: z.string().max(2000).optional().default(""),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  isPublic: z.boolean().optional().default(false),
});

export const createSnippet = async (
  request: FastifyRequest,
  reply: FastifyReply,
  db: LibSQLDatabase,
) => {
  const userId = request.session.user.id;

  const { title, code, language, description, tags, isPublic } =
    requestBodySchema.parse(request.body);

  const now = new Date().toISOString();
  const id = randomUUID();
  const shareId = randomUUID();

  const [snippet] = await db
    .insert(snippets)
    .values({
      id,
      userId,
      title,
      code,
      language,
      description,
      tags,
      isPublic,
      shareId,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return reply.status(201).send(snippet);
};
