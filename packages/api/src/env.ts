import dotenv from 'dotenv'
import { z } from 'zod'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('./snippetvault.db'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith('re_'),
  FROM_EMAIL: z.string().email(),
})

const parsed = envSchema.parse(process.env)

export const config = {
  port: parsed.PORT,
  host: parsed.HOST,
  nodeEnv: parsed.NODE_ENV,
  isProduction: parsed.NODE_ENV === 'production',
  isDevelopment: parsed.NODE_ENV === 'development',
  databaseUrl: parsed.DATABASE_URL,
  betterAuthSecret: parsed.BETTER_AUTH_SECRET,
  betterAuthUrl: parsed.BETTER_AUTH_URL,
  resendApiKey: parsed.RESEND_API_KEY,
  fromEmail: parsed.FROM_EMAIL,
  webDistPath: new URL('../../web/dist', import.meta.url).pathname,
} as const
