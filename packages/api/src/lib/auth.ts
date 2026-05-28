import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink } from 'better-auth/plugins'
import { db } from '../db/index.js'
import * as schema from '../db/auth-schema.js'
import { config } from '../env.js'
import { sendMagicLinkEmail } from './email.js'

export const auth = betterAuth({
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: { ...schema },
  }),
  trustedOrigins: config.isDevelopment ? ['http://localhost:5173'] : [config.betterAuthUrl],
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ to: email, url })
      },
    }),
  ],
})
