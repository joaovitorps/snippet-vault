import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { config } from '../env.js'

const sqlite = new Database(config.databaseUrl)
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './drizzle' })

console.log('Migrations applied successfully')
