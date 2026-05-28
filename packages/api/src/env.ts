import dotenv from "dotenv";
import { z } from "zod";
import { resolve } from "node:path";
import { getDirname } from "./utils/path.js";

dotenv.config({ path: resolve(getDirname(import.meta.url), "../../../.env") });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().default("./snippetvault.db"),
  LIBSQL_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith("re_"),
  FROM_EMAIL: z.string().email(),
});

const parsed = envSchema.parse(process.env);

export const config = {
  port: parsed.PORT,
  host: parsed.HOST,
  nodeEnv: parsed.NODE_ENV,
  isProduction: parsed.NODE_ENV === "production",
  isDevelopment: parsed.NODE_ENV === "development",
  databaseUrl: parsed.DATABASE_URL,
  libsqlAuthToken: parsed.LIBSQL_AUTH_TOKEN,
  betterAuthSecret: parsed.BETTER_AUTH_SECRET,
  betterAuthUrl: parsed.BETTER_AUTH_URL,
  resendApiKey: parsed.RESEND_API_KEY,
  fromEmail: parsed.FROM_EMAIL,
  webDistPath: new URL("../../web/dist", import.meta.url).pathname,
} as const;
