import { fastify } from "fastify";
import { z } from "zod";
import { config } from "./env.js";
import { snippetsRoutes } from "./http/controller/snippets/routes.js";
import { fpAuthMiddleware } from "./http/middleware/auth.js";
import { authRoutes } from "./routes/auth.js";
import { healthRoutes } from "./routes/health.js";

export const app = fastify({ logger: config.isDevelopment });

app.setErrorHandler((error, _, reply) => {
  if (error instanceof z.ZodError) {
    return reply
      .code(400)
      .send({ message: "Validation Error", issues: error.issues });
  }

  if (config.nodeEnv !== "production") {
    console.error(error);
  } else {
    // TODO: use datadog
  }

  return reply.code(500).send({ message: "Internal Server Error" });
});

app.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith("/api/")) {
    return reply.code(404).send({ error: "Not found" });
  }
  if (config.isProduction) {
    return reply.sendFile("index.html");
  }
});

if (config.isDevelopment) {
  await app.register(import("@fastify/cors"), {
    origin: "http://localhost:5173",
    credentials: true,
  });
}

if (config.isProduction) {
  await app.register(import("@fastify/helmet"));
  // Rate limiting is per-IP, not global. Each unique client gets its own 100 req/min bucket.
  // 100/min is generous for a scaffold — tighten per-route for auth/CRUD later (e.g. 5–10/min).
  // Docs: https://github.com/fastify/fastify-rate-limit
  await app.register(import("@fastify/rate-limit"), {
    max: 100,
    timeWindow: "1 minute",
  });
  // In production, Fastify is the single server. @fastify/static serves web/dist/ at /.
  // SPA fallback: API misses return JSON 404, everything else serves index.html
  // so TanStack Router handles client-side routing (/snippets, /signin, etc.).
  // turbo.json "dependsOn": ["^build"] ensures web/dist/ exists before API references it.
  await app.register(import("@fastify/static"), {
    root: config.webDistPath,
    prefix: "/",
  });
}

await app.register(fpAuthMiddleware);
await app.register(healthRoutes);
await app.register(authRoutes);
await app.register(snippetsRoutes);

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
