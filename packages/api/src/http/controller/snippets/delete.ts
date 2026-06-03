import { snippets } from "@api/db/schema";
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const requestParamsSchema = z.object({
  id: z.string().uuid(),
});

export const deleteSnippet = async (
  request: FastifyRequest,
  reply: FastifyReply,
  db: LibSQLDatabase,
) => {
  const { id } = requestParamsSchema.parse(request.params);
  const userId = request.session.user.id;

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

  return reply.status(204).send();
};
