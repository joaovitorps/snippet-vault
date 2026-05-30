# AGENTS.md

## Branch Strategy

Never commit directly to `main` or `master`. Always create a branch for your changes:

- Use `feat/<short-description>` for features (e.g., `feat/scaffold-monorepo`)
- Use `fix/<short-description>` for bug fixes (e.g., `fix/auth-redirect-loop`)

Branch names must be short, kebab-case, and describe the change.

## Branch Creation

Always create branches from `main` (or `master`). Before running `git checkout -b`:

1. Verify current branch: `git branch --show-current`
2. If not on `main`, switch first: `git checkout main && git pull`
3. Then create the branch: `git checkout -b feat/<short-description>`

Never create a branch from a detached HEAD or from any branch other than `main`.

## ESLint Disable Comments

Before adding any `eslint-disable` comment (e.g., `eslint-disable-next-line`), **always prompt the user** to discuss the situation. Do not unilaterally suppress lint rules — discuss why the rule is being triggered and whether the fix should be in the code or in the ESLint config instead.

### Known ESLint Exceptions

The following `eslint-disable` comments are intentionally allowed in the codebase:

**`eslint-disable-next-line no-empty-pattern`** — Vitest fixtures with no dependencies require an empty destructuring pattern (`{}`) as the first argument to the fixture function. This is a known Vitest pattern, not a code smell.

```ts
export const test = baseTest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, Use) => {
    // ...
  },
});
```

## GitHub CLI

Always use the `gh` CLI for any GitHub operations (PRs, issues, releases, checks, etc.). If `gh` is not installed or not authenticated, prompt the user to install/login before proceeding. Only fetch GitHub URLs/pages when the user explicitly asks for it.

## Pull Requests

When creating a PR, always use the template at `.github/pull_request_template.md`. Fill in every section (`gh pr create --body-file` or `gh pr edit` if already created). Do not skip the Type, Scope, or Verification checkboxes.

## Implementation Plans

When creating an implementation plan for a GitHub issue, post the plan as issue comments instead of creating local doc files:

- Post a **summary comment** with goal, architecture overview, and task list
- Post a **detailed plan comment** with the exact full plan content -- the same content you would write in a local file, including all checkboxes, code blocks, commit steps, expected outputs, and self-review
- Do not create local markdown files (e.g., `docs/`, `plans/` directories) for plans; the issue comment thread is the source of truth

## Tech Stack

| Layer       | Technology                                                    |
| ----------- | ------------------------------------------------------------- |
| Front-end   | Vite + React + TanStack Router + TanStack Query + react-icons |
| Styling     | Tailwind CSS v4 + clsx + tailwind-merge + cva                 |
| Components  | shadcn/ui                                                     |
| Code Editor | Monaco Editor (`@monaco-editor/react`)                        |
| Back-end    | Fastify (Node.js)                                             |
| Auth        | Better Auth                                                   |
| ORM         | Drizzle                                                       |
| Database    | SQLite (@libsql/client) — local files + Turso remote          |
| Container   | Docker (multi-stage) + Caddy                                  |
| Host        | DigitalOcean Droplet                                          |
| CI/CD       | GitHub Actions                                                |
| Monorepo    | npm workspaces + Turborepo                                    |

## Dev Tooling

| Tool                        | Purpose                                                                |
| --------------------------- | ---------------------------------------------------------------------- |
| Turborepo                   | Monorepo task orchestration + caching                                  |
| ESLint v9 (flat config)     | Linting JS/TS                                                          |
| typescript-eslint           | Type-aware ESLint rules                                                |
| eslint-config-prettier      | Disables ESLint/Prettier conflicts                                     |
| eslint-plugin-react-hooks   | React hooks rules                                                      |
| eslint-plugin-react-refresh | Vite HMR-safe exports                                                  |
| Prettier                    | Code formatting                                                        |
| husky + lint-staged         | Git hooks (pre-commit: format + lint + typecheck)                      |
| Vitest                      | Testing framework (globals: true in root + each package vitest.config) |
| @testing-library/react      | React component testing                                                |
| Happy DOM                   | Lightweight DOM environment                                            |
| drizzle-kit                 | Database schema generation + migrations                                |
| @better-auth/cli            | Auth table schema generation                                           |

### NPM Scripts

```
npm run dev      → turbo dev (both packages concurrently)
npm run build    → turbo build
npm run lint     → turbo lint (ESLint, cached)
npm run format   → prettier --write .
npm run typecheck → turbo typecheck (tsc --noEmit, cached)
npm run test     → turbo test (Vitest, cached)
```

### Shared Dev Dependencies

Some packages are declared in multiple workspaces (e.g. `vitest`, `typescript`). Keep versions in sync across all packages:

```
npm update <pkg1> <pkg2> ... -ws
```

The `-ws` flag targets all workspaces at once, avoiding version drift between packages.

### Git Hooks

```
git commit
  → pre-commit hook:
    1. lint-staged: prettier --write + eslint --fix on staged files
    2. turbo typecheck: full tsc --noEmit across monorepo
    → any failure blocks commit
```

## Codebase Patterns

### Imports

- **Named imports from `node:*` modules**: Always use named imports, never default.

  ```ts
  import { resolve } from "node:path"; // ✅
  import path from "node:path"; // ❌
  import { randomUUID } from "node:crypto"; // ✅
  import crypto from "node:crypto"; // ❌
  import { existsSync } from "node:fs"; // ✅
  import fs from "node:fs"; // ❌
  ```

- **`.js` extensions required in the API package**: Node.js ESM mandates file extensions on relative imports. Do not remove them.
  ```ts
  import { config } from "./env.js"; // ✅
  import { config } from "./env"; // ❌ (breaks at runtime)
  ```
- **No `.js` extensions in the web package**: The web package uses Vite's bundler resolution, not Node.js ESM, so `.js` extensions are not needed on imports.
  ```ts
  import { api } from "@/api/client"; // ✅ (web)
  import { api } from "@/api/client.js"; // ❌ (web — don't do this)
  ```

### Database

- **libsql driver for all environments**: The project uses `@libsql/client` + `drizzle-orm/libsql` as the single database driver. It accepts both local file paths and remote `libsql://` URLs:

  ```ts
  import { createClient } from "@libsql/client";
  import { drizzle } from "drizzle-orm/libsql";

  // Local (dev/test):
  const client = createClient({ url: "file:./snippetvault.db" });

  // Remote (production):
  const client = createClient({
    url: "libsql://db.turso.io",
    authToken: "...",
  });

  const db = drizzle(client);
  ```

- **async queries**: The libsql driver is async. All `db.select()`, `db.insert()`, `db.update()`, `db.delete()` calls must be `await`ed.

  ```ts
  const rows = await db.select().from(users); // ✅
  const rows = db.select().from(users); // ❌ returns Promise, not data
  ```

- **LIBSQL_AUTH_TOKEN**: Optional. Only required when `DATABASE_URL` is a `libsql://` URL pointing to a remote Turso database. Generate with `turso db tokens create <db-name>`.

### Test Infrastructure

- **Env vars stubbed via `setupFiles`**: `packages/api/src/tests/env-setup.ts` provides `vi.stubEnv` for all required env vars. Tests that transitively import `env.ts` no longer need to mock it.
- **`unstubEnvs: true`**: Vitest auto-restores env vars before each test.
- **Test fixtures live in `src/tests/fixtures/`**: Reusable test infrastructure (DB fixtures, mocks) is consolidated there.

### API Conventions

#### Fastify Routes

Every route file exports an async function receiving `FastifyInstance`:

```ts
import type { FastifyInstance } from "fastify";

export async function someRoutes(app: FastifyInstance) {
  app.get("/api/some", async (request, reply) => {
    return { status: "ok" };
  });
}
```

**Registration in `index.ts`:** Import the route plugin and call `await app.register(someRoutes)` after `authMiddleware`:

```ts
import { someRoutes } from "./routes/some.js";
// ...
await app.register(authMiddleware);
await app.register(someRoutes);
```

**Auth protection:** Add `{ preHandler: [app.requireAuth] }` as the route options object (second argument). Access the session via `request.session.user.id`:

```ts
app.get(
  "/api/protected",
  { preHandler: [app.requireAuth] },
  async (request, reply) => {
    const userId = request.session!.user.id;
    return { userId };
  },
);
```

Routes without `requireAuth` are public (e.g., `/api/health`).

#### Error Responses

All errors returned from routes use the shape `{ error: string }`. Return them via `reply.status(N).send(...)`:

```ts
// 401 — handled automatically by requireAuth preHandler
// 400 — validation errors
return reply.status(400).send({ error: "Title is required" });

// 403 — forbidden (not the owner)
return reply.status(403).send({ error: "You do not own this snippet" });

// 404 — not found
return reply.status(404).send({ error: "Snippet not found" });
```

The `requireAuth` middleware already returns `{ error: "Unauthorized" }` with status 401 — routes do not need to handle this case.

#### Request Validation

Use Fastify's built-in JSON Schema validation for HTTP request validation (body, querystring, params). Define schemas directly on the route with the `schema` option:

```ts
app.post(
  "/api/snippets",
  {
    schema: {
      body: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1 },
          code: { type: "string", minLength: 1 },
        },
        required: ["title", "code"],
      },
    },
    preHandler: [app.requireAuth],
  },
  async (request, reply) => {
    const { title, code } = request.body as { title: string; code: string };
    // ...
  },
);
```

Fastify automatically returns a 400 validation error response for invalid input.

**When to use Zod instead of JSON Schema:** Use Zod for validation that is not tied to the HTTP layer — e.g., validating data from external sources, composing validation logic across multiple functions, or when the validation rules are complex (conditional logic, transforms). For request/response validation, prefer Fastify JSON Schema.

#### Database Access

Import the database instance and schema from the db directory:

```ts
import { db } from "../db/index.js";
import { snippets } from "../db/schema.js";
```

**IDs:** Use `import { randomUUID } from "node:crypto"` for all primary key and share ID generation. This is built into Node.js 22 — no extra dependency needed.

**Timestamps:** Snippets and other app tables use ISO 8601 strings (`new Date().toISOString()`). Auth tables (user, session, account, verification) use epoch milliseconds (`new Date()`). Do not mix conventions within a table.

#### API Route Tests

Test files live next to the route file they test (e.g., `routes/snippets.test.ts` for `routes/snippets.ts`).

**Mocking Better Auth:** Mock `../lib/auth.js` with `vi.mock` at the top of the test file, before importing the route under test:

```ts
import { vi } from "vitest";

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
```

**DB fixture:** Each `dbTest(...)` callback receives a `{ db }` with an isolated ephemeral SQLite that has all migrations applied. Cleanup is automatic.

**Building a test app:** Create a `Fastify()` instance, register `authMiddleware` and the route plugin, then call `app.ready()`. Each test should build its own app instance and close it at the end.

```ts
dbTest("POST /api/snippets creates a snippet", async ({ db }) => {
  const app = Fastify();
  await app.register(authMiddleware);
  await app.register(snippetRoutes);
  await app.ready();

  // ...inject requests...

  await app.close();
});
```

**Session mock shape:**

```ts
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
```

**Unauthenticated requests:** Set `mockGetSession.mockResolvedValue(null)` — `requireAuth` will return 401.

### Web Conventions

#### TanStack Router

The web package uses **file-based routing** with `@tanstack/react-router`. All routes live under `packages/web/src/routes/`.

**Route file conventions:**

| Convention    | Example                                    | Behavior                                |
| ------------- | ------------------------------------------ | --------------------------------------- |
| `index.tsx`   | `routes/index.tsx`                         | Index route at `/`                      |
| `__root.tsx`  | `routes/__root.tsx`                        | Root layout shell (header, devtools)    |
| `_prefix.tsx` | `routes/_authenticated.tsx`                | Layout/group route — no URL segment     |
| Named files   | `routes/signin.tsx`                        | Page route at `/signin`                 |
| Nested files  | `routes/_authenticated/snippets/index.tsx` | Page at `/snippets/` inside auth layout |

**Route file shape:** Every route exports a `Route` object using `createFileRoute` (or `createRootRoute` for `__root.tsx`):

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/path")({
  component: () => <div>...</div>,
});
```

**Auth guard pattern:** Use a layout route with `beforeLoad` and `redirect`:

```tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!isAuthenticated) throw redirect({ to: "/signin" });
  },
  component: () => <Outlet />,
});
```

**`routeTree.gen.ts`:** This file is auto-generated by `@tanstack/router-plugin/vite`. Never edit it manually. It is excluded from ESLint.

**Import alias:** `@/` resolves to `./src/` (configured in `tsconfig.json` and `vite.config.ts`).

#### API Client

The API client lives at `@/api/client` and provides typed generic fetch wrappers:

```ts
import { api } from "@/api/client";

const snippets = await api.get<Snippet[]>("/snippets");
const created = await api.post<Snippet>("/snippets", { title: "..." });
const updated = await api.patch<Snippet>("/snippets/123", { title: "..." });
await api.delete("/snippets/123");
```

Key behaviors:

- Sets `credentials: "include"` on all requests for cookie-based auth.
- Vite dev server proxies `/api` requests to `http://localhost:3000` (the Fastify API).
- On error (non-2xx), throws `ApiError` with `status` (number) and `message` (from `body.error`).

#### TanStack Query

The `QueryClient` is created in `main.tsx` with `staleTime: 30_000` (30s) and `retry: 1`. It is passed to TanStack Router context, so it is available everywhere:

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

// Query example
const { data, isLoading } = useQuery({
  queryKey: ["snippets"],
  queryFn: () => api.get<Snippet[]>("/snippets"),
});

// Mutation example
const mutation = useMutation({
  mutationFn: (body: CreateSnippet) => api.post<Snippet>("/snippets", body),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["snippets"] }),
});
```

#### Styling

**Utility:** `import { cn } from "@/lib/utils"` — combines `clsx` and `tailwind-merge` (standard shadcn/ui pattern). Use this for conditional classes:

```tsx
<div className={cn("base-class", isActive && "active-class")} />
```

Some existing components use raw `className` strings directly — both styles are acceptable.

**Color palette (dark theme by default):**

| Role              | Class                                              |
| ----------------- | -------------------------------------------------- |
| Page background   | `bg-gray-950`                                      |
| Text primary      | `text-white`                                       |
| Text secondary    | `text-gray-400`                                    |
| Text muted        | `text-gray-500`                                    |
| Borders           | `border-gray-700`, `border-gray-800`               |
| Hover border      | `hover:border-gray-600`                            |
| Accent (primary)  | `bg-indigo-600`, `hover:bg-indigo-500`             |
| Accent (focus)    | `focus:border-indigo-500`, `focus:ring-indigo-500` |
| Input background  | `bg-gray-900`                                      |
| Input placeholder | `placeholder-gray-500`                             |

**shadcn/ui:** Dependencies are installed (`class-variance-authority`, `clsx`, `tailwind-merge`) but no components have been added yet. Add components with `npx shadcn@latest add <component>`.

## Installed Agent Skills

Located in `.agents/skills/`. These provide specialized agent guidance for each stack component:

| Skill                          | Source                                | Installs |
| ------------------------------ | ------------------------------------- | -------- |
| Fastify best practices         | `mcollina/skills`                     | 2.8K     |
| Better Auth best practices     | `better-auth/skills`                  | 53.6K    |
| TanStack Query best practices  | `deckardger/tanstack-agent-skills`    | 6.3K     |
| TanStack Router best practices | `deckardger/tanstack-agent-skills`    | 3.7K     |
| shadcn/ui                      | `shadcn/ui`                           | 164.2K   |
| Monorepo management            | `wshobson/agents`                     | 9.3K     |
| Drizzle ORM patterns           | `giuseppe-trisciuoglio/developer-kit` | 1.1K     |
| Tailwind CSS patterns          | `giuseppe-trisciuoglio/developer-kit` | 11.4K    |
| Multi-stage Dockerfile         | `github/awesome-copilot`              | 14.3K    |
| GitHub Actions docs            | `xixu-me/skills`                      | 175.9K   |
| Turso DB                       | `tursodatabase/agent-skills`          | 91       |
| Zod                            | `anivar/zod-skill`                    | 288      |
| Vitest                         | `itechmeat/llm-code`                  | 134      |
| React Testing Library          | `itechmeat/llm-code`                  | 882      |
