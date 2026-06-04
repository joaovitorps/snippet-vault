import { fastify } from "fastify";
import { fpAuthMiddleware } from "./auth.js";

const mockGetSession = vi.fn();

vi.mock("../../lib/auth.js", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

describe("requireAuth middleware", () => {
  const app = fastify();

  beforeAll(async () => {
    await app.register(fpAuthMiddleware);

    app.get(
      "/api/protected",
      { preHandler: [app.requireAuth] },
      async (request) => {
        return { userId: request.session.user.id };
      },
    );

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it("returns 401 when no session exists", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await app.inject({ method: "GET", url: "/api/protected" });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.payload)).toEqual({ error: "Unauthorized" });
  });

  it("calls auth.api.getSession with request headers", async () => {
    mockGetSession.mockResolvedValue(null);

    await app.inject({
      method: "GET",
      url: "/api/protected",
      headers: { cookie: "test-cookie=value" },
    });

    expect(mockGetSession).toHaveBeenCalledOnce();
    expect(mockGetSession.mock.calls[0][0].headers).toBeDefined();
  });

  it("returns 200 and attaches session when authenticated", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", name: "Test User", email: "test@example.com" },
      session: {
        id: "sess-1",
        userId: "user-1",
        token: "abc",
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const res = await app.inject({ method: "GET", url: "/api/protected" });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ userId: "user-1" });
  });
});
