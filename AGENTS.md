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
})
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

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Front-end   | Vite + React + TanStack Router + TanStack Query + react-icons |
| Styling     | Tailwind CSS v4 + clsx + tailwind-merge + cva      |
| Components  | shadcn/ui                                         |
| Code Editor | Monaco Editor (`@monaco-editor/react`)          |
| Back-end    | Fastify (Node.js)                               |
| Auth        | Better Auth                                     |
| ORM         | Drizzle                                         |
| Database    | SQLite (better-sqlite3)                         |
| Container   | Docker (multi-stage) + Caddy                    |
| Host        | DigitalOcean Droplet                            |
| CI/CD       | GitHub Actions                                  |
| Monorepo    | npm workspaces + Turborepo                      |

## Dev Tooling

| Tool                        | Purpose                                           |
| --------------------------- | ------------------------------------------------- |
| Turborepo                   | Monorepo task orchestration + caching             |
| ESLint v9 (flat config)     | Linting JS/TS                                     |
| typescript-eslint           | Type-aware ESLint rules                           |
| eslint-config-prettier      | Disables ESLint/Prettier conflicts                |
| eslint-plugin-react-hooks   | React hooks rules                                 |
| eslint-plugin-react-refresh | Vite HMR-safe exports                             |
| Prettier                    | Code formatting                                   |
| husky + lint-staged         | Git hooks (pre-commit: format + lint + typecheck) |
| Vitest                      | Testing framework (globals: true in root + each package vitest.config) |
| @testing-library/react      | React component testing                           |
| Happy DOM                   | Lightweight DOM environment                       |
| drizzle-kit                 | Database schema generation + migrations           |
| @better-auth/cli            | Auth table schema generation                      |

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
  import { resolve } from 'node:path'     // ✅
  import path from 'node:path'            // ❌
  import { randomUUID } from 'node:crypto' // ✅
  import crypto from 'node:crypto'         // ❌
  import { existsSync } from 'node:fs'     // ✅
  import fs from 'node:fs'                 // ❌
  ```

- **`.js` extensions required**: Node.js ESM mandates file extensions on relative imports. Do not remove them.
  ```ts
  import { config } from './env.js'       // ✅
  import { config } from './env'          // ❌ (breaks at runtime)
  ```

### Test Infrastructure

- **Env vars stubbed via `setupFiles`**: `packages/api/src/tests/env-setup.ts` provides `vi.stubEnv` for all required env vars. Tests that transitively import `env.ts` no longer need to mock it.
- **`unstubEnvs: true`**: Vitest auto-restores env vars before each test.
- **Test fixtures live in `src/tests/fixtures/`**: Reusable test infrastructure (DB fixtures, mocks) is consolidated there.

## Installed Agent Skills

Located in `.agents/skills/`. These provide specialized agent guidance for each stack component:

| Skill                          | Source                                | Installs |
| ------------------------------ | ------------------------------------- | -------- |
| Fastify best practices         | `mcollina/skills`                     | 2.8K     |
| Better Auth best practices     | `better-auth/skills`                  | 53.6K    |
| TanStack Query best practices  | `deckardger/tanstack-agent-skills`    | 6.3K     |
| TanStack Router best practices | `deckardger/tanstack-agent-skills`    | 3.7K     |
| Drizzle ORM patterns           | `giuseppe-trisciuoglio/developer-kit` | 1.1K     |
| Tailwind CSS patterns          | `giuseppe-trisciuoglio/developer-kit` | 11.4K    |
| Multi-stage Dockerfile         | `github/awesome-copilot`              | 14.3K    |
| Monorepo management            | `wshobson/agents`                     | 9.3K     |
