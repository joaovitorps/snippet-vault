import { describe, expect } from "vitest";
import { eq } from "drizzle-orm";
import { snippets } from "./schema.js";
import { user } from "./auth-schema.js";
import { test } from "../tests/fixtures/db.js";

describe("snippets schema", () => {
  test("should insert and query a snippet", async ({ db }) => {
    await db.insert(user).values({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [snippet] = await db
      .insert(snippets)
      .values({
        id: "snippet-1",
        userId: "user-1",
        title: "Hello World",
        code: 'console.log("hello")',
        language: "javascript",
        tags: ["greeting"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    expect(snippet.title).toBe("Hello World");
    expect(snippet.language).toBe("javascript");
    expect(snippet.tags).toEqual(["greeting"]);
    expect(snippet.isPublic).toBe(false);
  });

  test("should query snippet by id", async ({ db }) => {
    await db.insert(user).values({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(snippets).values({
      id: "snippet-2",
      userId: "user-1",
      title: "By ID",
      code: "x",
      language: "ts",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const [result] = await db
      .select()
      .from(snippets)
      .where(eq(snippets.id, "snippet-2"));

    expect(result?.title).toBe("By ID");
  });

  test("should return undefined for non-existent snippet", async ({ db }) => {
    const [result] = await db
      .select()
      .from(snippets)
      .where(eq(snippets.id, "nonexistent"));

    expect(result).toBeUndefined();
  });
});
