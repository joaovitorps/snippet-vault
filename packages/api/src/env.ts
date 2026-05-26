import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('./snippetvault.db'),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().startsWith('re_'),
  FROM_EMAIL: z.string().email().default('noreply@snippetvault.joaovitorps.dev'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = {
  port: parsed.data.PORT,
  host: parsed.data.HOST,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  databaseUrl: parsed.data.DATABASE_URL,
  betterAuthSecret: parsed.data.BETTER_AUTH_SECRET,
  betterAuthUrl: parsed.data.BETTER_AUTH_URL,
  resendApiKey: parsed.data.RESEND_API_KEY,
  fromEmail: parsed.data.FROM_EMAIL,
  webDistPath: new URL('../../web/dist', import.meta.url).pathname,
} as const
