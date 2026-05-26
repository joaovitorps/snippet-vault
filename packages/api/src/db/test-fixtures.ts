import { test as baseTest } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface Fixtures {
  db: BetterSQLite3Database
}

export const test = baseTest.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, Use) => {
    const testDbPath = path.resolve(__dirname, `../../test-snippetvault-${crypto.randomUUID()}.db`)
    const sqlite = new Database(testDbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    const db = drizzle(sqlite)
    migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') })
    await Use(db)
    sqlite.close()
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath)
    const walPath = `${testDbPath}-wal`
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath)
    const shmPath = `${testDbPath}-shm`
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath)
  },
})
