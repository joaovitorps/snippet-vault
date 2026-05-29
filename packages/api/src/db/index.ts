import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "../env.js";
import { normalizeDbUrl } from "./normalize-url.js";

const client = createClient({
  url: normalizeDbUrl(config.databaseUrl),
  authToken: config.libsqlAuthToken,
});

export const db = drizzle(client);
