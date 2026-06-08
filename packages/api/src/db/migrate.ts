import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { resolve } from "node:path";
import { config } from "../env.js";
import { getDirname } from "../utils/path.js";
import { normalizeDbUrl } from "./normalize-url.js";

const migrationsFolder = resolve(getDirname(import.meta.url), "../../drizzle");

async function runMigrations() {
  const client = createClient({
    url: normalizeDbUrl(config.databaseUrl),
    authToken: config.libsqlAuthToken,
  });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder });
  client.close();

  console.log("Migrations applied successfully");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
