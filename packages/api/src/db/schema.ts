import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema.js'

export const snippets = sqliteTable('snippets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id),
  title: text('title').notNull(),
  code: text('code').notNull(),
  language: text('language').notNull(),
  description: text('description').notNull().default(''),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  shareId: text('share_id').unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})
