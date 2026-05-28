import fp from "fastify-plugin";
import type { preHandlerHookHandler } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: preHandlerHookHandler;
  }

  interface FastifyRequest {
    session: typeof auth.$Infer.Session | null;
  }
}

const requireAuth: preHandlerHookHandler = async (request, reply) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  request.session = session;
};

export default fp(
  async function authMiddleware(fastify) {
    fastify.decorateRequest("session", null);
    fastify.decorate("requireAuth", requireAuth);
  },
  {
    name: "auth-middleware",
  },
);
