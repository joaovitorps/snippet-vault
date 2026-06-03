import { snippets } from "@api/db/schema";
import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const requestParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getSnippet = async (
  request: FastifyRequest,
  reply: FastifyReply,
  db: LibSQLDatabase,
) => {
  const { id } = requestParamsSchema.parse(request.params);

  const [snippet] = await db.select().from(snippets).where(eq(snippets.id, id));

  if (!snippet) {
    return reply.status(404).send({ error: "Snippet not found" });
  }

  return reply.status(200).send(snippet);
};
