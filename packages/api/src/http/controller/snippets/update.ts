import { snippets } from "@api/db/schema";
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const requestParamsSchema = z.object({
  id: z.string().uuid(),
});

const requestBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  code: z.string().min(1).optional(),
  language: z.string().min(1).max(50).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPublic: z.boolean().optional(),
});

export const updateSnippet = async (
  request: FastifyRequest,
  reply: FastifyReply,
  db: LibSQLDatabase,
) => {
  const { id } = requestParamsSchema.parse(request.params);
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

  const updateBody = requestBodySchema.parse(request.body);

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    ...updateBody,
    updatedAt: now,
  };

  if (updateBody.isPublic === true) {
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

  return reply.code(200).send(updated);
};
