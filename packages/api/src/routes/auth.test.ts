import { vi } from "vitest";
import Fastify from "fastify";

vi.mock("../db/index.js", () => ({
  db: {},
}));

vi.mock("../lib/auth.js", () => ({
  auth: {
    handler: vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
      ),
  },
}));

import { authRoutes } from "./auth.js";

describe("Auth routes", () => {
  const app = Fastify();

  beforeAll(async () => {
    await app.register(authRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers GET /api/auth/* route", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/ok",
    });

    expect(res.statusCode).toBe(200);
  });

  it("registers POST /api/auth/* route", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/magic-link",
      payload: { email: "test@example.com" },
    });

    expect(res.statusCode).toBe(200);
  });
});
