import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config } from "../env.js";

const client = createClient({
  url: config.databaseUrl,
  authToken: config.libsqlAuthToken,
});

export const db = drizzle(client);
