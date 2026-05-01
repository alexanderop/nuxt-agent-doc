import type { H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { db, schema } from '../db/client'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const DAILY_LIMIT = 20

function todayKey(ip: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `rate:agent:${ip}:${date}`
}

function resolveIP(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

export async function consumeAgentRateLimit(event: H3Event): Promise<void> {
  const ip = resolveIP(event)
  const key = todayKey(ip)

  await db.transaction(async (tx: DbTransaction) => {
    await tx.insert(schema.agentDailyUsage).values({ dayKey: key, count: 1 })
      .onConflictDoUpdate({
        target: schema.agentDailyUsage.dayKey,
        set: { count: sql`${schema.agentDailyUsage.count} + 1` }
      })
    const [row] = await tx.select().from(schema.agentDailyUsage).where(eq(schema.agentDailyUsage.dayKey, key))
    const used = row?.count ?? 0
    if (used > DAILY_LIMIT) {
      throw createError({
        statusCode: 429,
        message: `You've reached the daily limit of ${DAILY_LIMIT} messages. Try again tomorrow.`
      })
    }
  })
}
