import { defineConfig } from "drizzle-kit";
import { normalizeDbUrl } from "./src/db/normalize-url.js";

const dbUrl = process.env.DATABASE_URL ?? "./snippetvault.db";

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  dialect: "turso",
  dbCredentials: {
    url: normalizeDbUrl(dbUrl),
    authToken: process.env.LIBSQL_AUTH_TOKEN || undefined,
  },
});
