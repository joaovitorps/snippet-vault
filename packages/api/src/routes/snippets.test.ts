import { vi } from "vitest";
import Fastify from "fastify";
import { eq, type InferInsertModel } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { snippets } from "../db/schema.js";
import { user } from "../db/auth-schema.js";

const mockGetSession = vi.fn();

vi.mock("../lib/auth.js", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

import { test as dbTest } from "../tests/fixtures/db.js";
import authMiddleware from "../middleware/auth.js";
import { snippetRoutes } from "./snippets.js";

function mockSession(userId: string) {
  mockGetSession.mockResolvedValue({
    user: { id: userId, name: "Test", email: "test@test.com" },
    session: {
      id: "sess-1",
      userId,
      token: "abc",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function seedUser(db: LibSQLDatabase, userId: string) {
  await db.insert(user).values({
    id: userId,
    name: "Test User",
    email: `${userId}@test.com`,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function seedSnippet(
  overrides: Partial<InferInsertModel<typeof snippets>> = {},
): InferInsertModel<typeof snippets> {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? "s-1",
    userId: overrides.userId ?? "user-1",
    title: overrides.title ?? "Test Snippet",
    code: overrides.code ?? "console.log('test')",
    language: overrides.language ?? "ts",
    description: overrides.description ?? "",
    tags: overrides.tags ?? [],
    isPublic: overrides.isPublic ?? false,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    ...overrides,
  };
}

describe("Snippets routes", () => {
  dbTest("POST /api/snippets creates a snippet", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    const res = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: {
        title: "Hello World",
        code: "console.log('hi')",
        language: "javascript",
        tags: ["greeting"],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.title).toBe("Hello World");
    expect(body.code).toBe("console.log('hi')");
    expect(body.language).toBe("javascript");
    expect(body.tags).toEqual(["greeting"]);
    expect(body.id).toBeDefined();
    expect(body.shareId).toBeDefined();
    expect(body.userId).toBe("user-1");
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();

    await app.close();
  });

  dbTest("POST /api/snippets returns 401 without session", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    mockGetSession.mockResolvedValue(null);

    const res = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "Test", code: "x", language: "ts" },
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.payload)).toEqual({ error: "Unauthorized" });

    await app.close();
  });

  dbTest("POST /api/snippets returns 400 with invalid body", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    mockSession("user-1");

    const res = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "" },
    });

    expect(res.statusCode).toBe(400);

    await app.close();
  });

  dbTest("GET /api/snippets lists own snippets", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    await db
      .insert(snippets)
      .values([
        seedSnippet({ id: "s-1", title: "Snippet 1", tags: ["foo"] }),
        seedSnippet({ id: "s-2", title: "Snippet 2", tags: ["bar"] }),
      ]);

    const res = await app.inject({ method: "GET", url: "/api/snippets" });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);

    await app.close();
  });

  dbTest(
    "GET /api/snippets filters by public=true on own snippets",
    async ({ db }) => {
      const app = Fastify();
      await app.register(authMiddleware);
      await app.register(snippetRoutes, { db });
      await app.ready();

      await seedUser(db, "user-1");
      mockSession("user-1");

      await db
        .insert(snippets)
        .values([
          seedSnippet({ id: "s-1", title: "Public", isPublic: true }),
          seedSnippet({ id: "s-2", title: "Private", isPublic: false }),
        ]);

      const res = await app.inject({
        method: "GET",
        url: "/api/snippets?public=true",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("Public");

      await app.close();
    },
  );

  dbTest(
    "GET /api/snippets shows only public snippets for other users",
    async ({ db }) => {
      const app = Fastify();
      await app.register(authMiddleware);
      await app.register(snippetRoutes, { db });
      await app.ready();

      await seedUser(db, "user-1");
      await seedUser(db, "user-viewer");
      mockSession("user-viewer");

      await db.insert(snippets).values([
        seedSnippet({
          id: "s-1",
          title: "Public",
          userId: "user-1",
          isPublic: true,
        }),
        seedSnippet({
          id: "s-2",
          title: "Private",
          userId: "user-1",
          isPublic: false,
        }),
      ]);

      const res = await app.inject({
        method: "GET",
        url: "/api/snippets?userId=user-1",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("Public");

      await app.close();
    },
  );

  dbTest("GET /api/snippets filters by tag", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    await db
      .insert(snippets)
      .values([
        seedSnippet({ id: "s-1", title: "React Hook", tags: ["react"] }),
        seedSnippet({ id: "s-2", title: "Express Route", tags: ["express"] }),
      ]);

    const res = await app.inject({
      method: "GET",
      url: "/api/snippets?tag=react",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("React Hook");

    await app.close();
  });

  dbTest("GET /api/snippets searches by text", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    await db.insert(snippets).values([
      seedSnippet({
        id: "s-1",
        title: "React Hook",
        code: "useState()",
        description: "",
      }),
      seedSnippet({
        id: "s-2",
        title: "Express Route",
        code: "app.get()",
        description: "",
      }),
    ]);

    const res = await app.inject({
      method: "GET",
      url: "/api/snippets?search=React",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("React Hook");

    await app.close();
  });

  dbTest("GET /api/snippets/:id returns a single snippet", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    await db
      .insert(snippets)
      .values(seedSnippet({ id: "s-1", title: "React Hook" }));

    const res = await app.inject({ method: "GET", url: "/api/snippets/s-1" });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.title).toBe("React Hook");

    await app.close();
  });

  dbTest(
    "GET /api/snippets/:id returns 404 for non-existent",
    async ({ db }) => {
      const app = Fastify();
      await app.register(authMiddleware);
      await app.register(snippetRoutes, { db });
      await app.ready();

      await seedUser(db, "user-1");
      mockSession("user-1");

      const res = await app.inject({
        method: "GET",
        url: "/api/snippets/nonexistent",
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload)).toEqual({ error: "Snippet not found" });

      await app.close();
    },
  );

  dbTest("PUT /api/snippets/:id updates a snippet", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    await db
      .insert(snippets)
      .values(seedSnippet({ id: "s-1", title: "Old Title" }));

    const res = await app.inject({
      method: "PUT",
      url: "/api/snippets/s-1",
      payload: { title: "New Title" },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.title).toBe("New Title");

    await app.close();
  });

  dbTest("PUT /api/snippets/:id returns 403 for non-owner", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    await seedUser(db, "user-2");
    mockSession("user-2");

    await db
      .insert(snippets)
      .values(seedSnippet({ id: "s-1", userId: "user-1", title: "Old Title" }));

    const res = await app.inject({
      method: "PUT",
      url: "/api/snippets/s-1",
      payload: { title: "Hijacked" },
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.payload)).toEqual({
      error: "You do not own this snippet",
    });

    await app.close();
  });

  dbTest("DELETE /api/snippets/:id deletes a snippet", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    await db
      .insert(snippets)
      .values(seedSnippet({ id: "s-1", title: "To Delete" }));

    const res = await app.inject({
      method: "DELETE",
      url: "/api/snippets/s-1",
    });

    expect(res.statusCode).toBe(204);

    const [deleted] = await db
      .select()
      .from(snippets)
      .where(eq(snippets.id, "s-1"));
    expect(deleted).toBeUndefined();

    await app.close();
  });

  dbTest(
    "DELETE /api/snippets/:id returns 403 for non-owner",
    async ({ db }) => {
      const app = Fastify();
      await app.register(authMiddleware);
      await app.register(snippetRoutes, { db });
      await app.ready();

      await seedUser(db, "user-1");
      await seedUser(db, "user-2");
      mockSession("user-2");

      await db
        .insert(snippets)
        .values(
          seedSnippet({ id: "s-1", userId: "user-1", title: "Not Yours" }),
        );

      const res = await app.inject({
        method: "DELETE",
        url: "/api/snippets/s-1",
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload)).toEqual({
        error: "You do not own this snippet",
      });

      await app.close();
    },
  );

  dbTest("GET /api/snippets paginates results", async ({ db }) => {
    const app = Fastify();
    await app.register(authMiddleware);
    await app.register(snippetRoutes, { db });
    await app.ready();

    await seedUser(db, "user-1");
    mockSession("user-1");

    const rows = Array.from({ length: 5 }, (_, i) =>
      seedSnippet({ id: `s-${i + 1}`, title: `Snippet ${i + 1}` }),
    );
    await db.insert(snippets).values(rows);

    const res = await app.inject({
      method: "GET",
      url: "/api/snippets?page=1&limit=2",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(5);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);

    await app.close();
  });
});
