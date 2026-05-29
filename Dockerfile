# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files for dependency installation (layer cache: only re-runs when deps change)
COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
RUN npm ci

# Copy source code and build
COPY turbo.json tsconfig.base.json ./
COPY packages/api/tsconfig.json packages/api/
COPY packages/web/tsconfig.json packages/web/
COPY packages/web/tsconfig.node.json packages/web/
COPY packages/web/vite.config.ts packages/web/
COPY packages/web/index.html packages/web/
COPY packages/api/src/ packages/api/src/
COPY packages/web/src/ packages/web/src/
RUN npm run build

# Strip devDependencies for a slim production image
RUN npm prune --omit=dev

# Stage 2: Production
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/package.json package.json
COPY --from=build /app/packages/api/node_modules/ packages/api/node_modules/
COPY --from=build /app/packages/api/package.json packages/api/
COPY --from=build /app/packages/api/dist/ packages/api/dist/
COPY --from=build /app/packages/web/dist/ packages/web/dist/

USER node
ENV NODE_ENV=production
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "packages/api/dist/index.js"]
