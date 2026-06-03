import { makeSnippet } from "@api/tests/factories/make-snippet.js";
import { makeUser } from "@api/tests/factories/make-user.js";
import { eq } from "drizzle-orm";
import { vi } from "vitest";
import { snippets } from "../db/schema.js";
import { test as dbTest } from "../tests/fixtures/db.js";

const mockGetSession = vi.fn();

vi.mock("../lib/auth.js", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

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

describe("Snippets routes", () => {
  dbTest("POST /api/snippets creates a snippet", async ({ app, db }) => {
    const { createdUser } = await makeUser(db);
    mockSession(createdUser.id);

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
    expect(body).toEqual(
      expect.objectContaining({
        title: "Hello World",
        code: "console.log('hi')",
        language: "javascript",
        tags: ["greeting"],
      }),
    );

    expect(body.id).toBeDefined();
    expect(body.shareId).toBeDefined();
    expect(body.userId).toBe(createdUser.id);
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
  });

  dbTest("POST /api/snippets returns 401 without session", async ({ app }) => {
    mockGetSession.mockResolvedValue(null);

    const res = await app.inject({
      method: "POST",
      url: "/api/snippets",
      payload: { title: "Test", code: "x", language: "ts" },
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.payload)).toEqual({ error: "Unauthorized" });
  });

  dbTest(
    "POST /api/snippets returns 400 with invalid body",
    async ({ app }) => {
      mockSession("user-1");

      const res = await app.inject({
        method: "POST",
        url: "/api/snippets",
        payload: { title: "" },
      });

      expect(res.statusCode).toBe(400);
    },
  );

  dbTest("GET /api/snippets lists own snippets", async ({ app, db }) => {
    const { createdUser } = await makeUser(db);
    mockSession(createdUser.id);

    await makeSnippet(db, { userId: createdUser.id });
    await makeSnippet(db, { userId: createdUser.id });

    const res = await app.inject({ method: "GET", url: "/api/snippets" });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  dbTest(
    "GET /api/snippets filters by public=true on own snippets",
    async ({ app, db }) => {
      const { createdUser } = await makeUser(db);
      mockSession(createdUser.id);

      await makeSnippet(db, {
        userId: createdUser.id,
        title: "Public",
        isPublic: true,
      });

      await makeSnippet(db, {
        userId: createdUser.id,
        title: "Private",
        isPublic: false,
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/snippets?public=true",
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("Public");
    },
  );

  dbTest(
    "GET /api/snippets shows only public snippets for other users",
    async ({ app, db }) => {
      const user1 = await makeUser(db);
      const user2 = await makeUser(db);
      mockSession(user1.createdUser.id);

      await makeSnippet(db, {
        userId: user1.createdUser.id,
        title: "Public",
        isPublic: true,
      });

      await makeSnippet(db, {
        userId: user2.createdUser.id,
        title: "Private",
        isPublic: false,
      });

      const res = await app.inject({
        method: "GET",
        url: `/api/snippets?userId=${user1.createdUser.id}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].title).toBe("Public");
    },
  );

  dbTest("GET /api/snippets filters by tag", async ({ app, db }) => {
    const { createdUser } = await makeUser(db);
    mockSession(createdUser.id);

    await makeSnippet(db, {
      userId: createdUser.id,
      title: "React Hook",
      tags: ["react"],
    });
    await makeSnippet(db, {
      userId: createdUser.id,
      title: "Express Route",
      tags: ["express"],
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/snippets?tag=react",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("React Hook");
  });

  dbTest("GET /api/snippets searches by text", async ({ app, db }) => {
    const { createdUser } = await makeUser(db);
    mockSession(createdUser.id);

    await makeSnippet(db, {
      userId: createdUser.id,
      title: "React Hook",
      code: "useState()",
      description: "",
    });
    await makeSnippet(db, {
      userId: createdUser.id,
      title: "Express Route",
      code: "app.get()",
      description: "",
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/snippets?search=React",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].title).toBe("React Hook");
  });

  dbTest(
    "GET /api/snippets/:id returns a single snippet",
    async ({ app, db }) => {
      const { createdUser } = await makeUser(db);
      mockSession(createdUser.id);

      const { createdSnippet } = await makeSnippet(db, {
        userId: createdUser.id,
        title: "React Hook",
      });

      const res = await app.inject({
        method: "GET",
        url: `/api/snippets/${createdSnippet.id}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.title).toBe("React Hook");
    },
  );

  dbTest(
    "GET /api/snippets/:id returns 404 for non-existent",
    async ({ app, db }) => {
      const { createdUser } = await makeUser(db);
      mockSession(createdUser.id);

      const res = await app.inject({
        method: "GET",
        url: "/api/snippets/nonexistent",
      });

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.payload)).toEqual({ error: "Snippet not found" });
    },
  );

  dbTest("PUT /api/snippets/:id updates a snippet", async ({ app, db }) => {
    const { createdUser } = await makeUser(db);
    mockSession(createdUser.id);

    const { createdSnippet } = await makeSnippet(db, {
      userId: createdUser.id,
      title: "Old Title",
    });

    const res = await app.inject({
      method: "PUT",
      url: `/api/snippets/${createdSnippet.id}`,
      payload: { title: "New Title" },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.title).toBe("New Title");
  });

  dbTest(
    "PUT /api/snippets/:id returns 403 for non-owner",
    async ({ app, db }) => {
      const user1 = await makeUser(db);
      const user2 = await makeUser(db);
      mockSession(user2.createdUser.id);

      const { createdSnippet } = await makeSnippet(db, {
        userId: user1.createdUser.id,
        title: "Old Title",
      });

      const res = await app.inject({
        method: "PUT",
        url: `/api/snippets/${createdSnippet.id}`,
        payload: { title: "Hijacked" },
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload)).toEqual({
        error: "You do not own this snippet",
      });
    },
  );

  dbTest("DELETE /api/snippets/:id deletes a snippet", async ({ app, db }) => {
    const { createdUser } = await makeUser(db);
    mockSession(createdUser.id);

    const { createdSnippet } = await makeSnippet(db, {
      userId: createdUser.id,
      title: "To Delete",
    });

    const res = await app.inject({
      method: "DELETE",
      url: `/api/snippets/${createdSnippet.id}`,
    });

    expect(res.statusCode).toBe(204);

    const [deleted] = await db
      .select()
      .from(snippets)
      .where(eq(snippets.id, createdSnippet.id));
    expect(deleted).toBeUndefined();
  });

  dbTest(
    "DELETE /api/snippets/:id returns 403 for non-owner",
    async ({ app, db }) => {
      const user1 = await makeUser(db);
      const user2 = await makeUser(db);
      mockSession(user2.createdUser.id);

      const { createdSnippet } = await makeSnippet(db, {
        userId: user1.createdUser.id,
        title: "Not Yours",
      });

      const res = await app.inject({
        method: "DELETE",
        url: `/api/snippets/${createdSnippet.id}`,
      });

      expect(res.statusCode).toBe(403);
      expect(JSON.parse(res.payload)).toEqual({
        error: "You do not own this snippet",
      });
    },
  );

  dbTest("GET /api/snippets paginates results", async ({ app, db }) => {
    const { createdUser } = await makeUser(db);
    mockSession(createdUser.id);

    for (let i = 0; i < 5; i++) {
      await makeSnippet(db, {
        userId: createdUser.id,
        title: `Snippet ${i + 1}`,
      });
    }

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
  });
});
