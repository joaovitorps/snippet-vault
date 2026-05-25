# AGENTS.md

## Branch Strategy

Never commit directly to `main` or `master`. Always create a branch for your changes:

- Use `feat/<short-description>` for features (e.g., `feat/scaffold-monorepo`)
- Use `fix/<short-description>` for bug fixes (e.g., `fix/auth-redirect-loop`)

Branch names must be short, kebab-case, and describe the change.

## Tech Stack

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Front-end   | Vite + React + TanStack Router + TanStack Query + react-icons |
| Styling     | Tailwind CSS v4                                 |
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
