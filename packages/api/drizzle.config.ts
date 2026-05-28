import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: ["./src/db/schema.ts", "./src/db/auth-schema.ts"],
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${process.env.DATABASE_URL ?? "./snippetvault.db"}`,
  },
});
