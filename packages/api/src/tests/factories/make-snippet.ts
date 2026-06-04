import { snippets } from "@api/db/schema.js";
import { InferInsertModel } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { randomUUID } from "node:crypto";

export async function makeSnippet(
  db: LibSQLDatabase,
  overrides: Partial<InferInsertModel<typeof snippets>> = {},
) {
  const snippetsId = randomUUID();
  const now = new Date().toISOString();
  const newSnippet = {
    id: snippetsId,
    userId: "user-1",
    title: "Test Snippet",
    code: "console.log('test')",
    language: "ts",
    description: "",
    tags: [],
    isPublic: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  const [createdSnippet] = await db
    .insert(snippets)
    .values(newSnippet)
    .returning();

  return { createdSnippet };
}
