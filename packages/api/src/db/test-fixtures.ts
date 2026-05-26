import { test as baseTest } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testDbPath = path.resolve(__dirname, '../../test-snippetvault.db')

export const test = baseTest.extend({
  db: async ({}, use) => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)
    const sqlite = new Database(testDbPath)
    sqlite.pragma('foreign_keys = ON')
    const db = drizzle(sqlite)
    migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') })
    await use(db)
    sqlite.close()
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)
  },
})
