import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core'
import type { UIMessage } from 'ai'
import type { AgentMode } from '~~/shared/agent'

export const agentChats = sqliteTable('agent_chats', {
  id: text('id').primaryKey(),
  messages: text('messages', { mode: 'json' }).notNull().$type<UIMessage[]>(),
  fingerprint: text('fingerprint').notNull(),
  mode: text('mode').notNull().default('classical').$type<AgentMode>(),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  estimatedCost: real('estimated_cost').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  requestCount: integer('request_count').notNull().default(0),
  createdAt: integer({ mode: 'timestamp' }).notNull(),
  updatedAt: integer({ mode: 'timestamp' }).notNull()
}, t => [index('agent_chats_fingerprint_idx').on(t.fingerprint)])

export const agentDailyUsage = sqliteTable('agent_daily_usage', {
  dayKey: text('day_key').primaryKey(),
  count: integer('count').notNull()
})
