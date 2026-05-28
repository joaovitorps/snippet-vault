import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DATABASE_URL ?? "./snippetvault.db";
const isRemote = dbUrl.startsWith("libsql://");

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: isRemote
    ? { url: dbUrl, authToken: process.env.LIBSQL_AUTH_TOKEN }
    : { url: `file:${dbUrl}` },
});
