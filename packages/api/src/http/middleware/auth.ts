import { auth } from "@api/lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import type { preHandlerHookHandler } from "fastify";
import { fastifyPlugin } from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: preHandlerHookHandler;
  }

  interface FastifyRequest {
    session: typeof auth.$Infer.Session;
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

export const fpAuthMiddleware = fastifyPlugin(
  async function authMiddleware(fastify) {
    fastify.decorate("requireAuth", requireAuth);
  },
  {
    name: "auth-middleware",
  },
);
