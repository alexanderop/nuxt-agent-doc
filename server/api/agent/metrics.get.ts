import { eq, sql } from 'drizzle-orm'
import { db, schema } from '../../db/client'
import { getAgentFingerprint } from '../../utils/agent-fingerprint'
import { emptyAggregate, isAgentMode, type ModeAggregate } from '~~/shared/agent'

export default defineEventHandler(async (event): Promise<{ classical: ModeAggregate, code: ModeAggregate }> => {
  const result = { classical: emptyAggregate('classical'), code: emptyAggregate('code') }

  const fingerprint = getAgentFingerprint(event)
  if (!fingerprint) return result

  const rows = await db
    .select({
      mode: schema.agentChats.mode,
      chats: sql<number>`count(*)`,
      requests: sql<number>`coalesce(sum(${schema.agentChats.requestCount}), 0)`,
      inputTokens: sql<number>`coalesce(sum(${schema.agentChats.inputTokens}), 0)`,
      outputTokens: sql<number>`coalesce(sum(${schema.agentChats.outputTokens}), 0)`,
      estimatedCost: sql<number>`coalesce(sum(${schema.agentChats.estimatedCost}), 0)`,
      durationMs: sql<number>`coalesce(sum(${schema.agentChats.durationMs}), 0)`
    })
    .from(schema.agentChats)
    .where(eq(schema.agentChats.fingerprint, fingerprint))
    .groupBy(schema.agentChats.mode)

  for (const row of rows) {
    if (isAgentMode(row.mode)) {
      result[row.mode] = { ...row, mode: row.mode }
    }
  }
  return result
})
