import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

export function getAgentFingerprint(event: H3Event): string | null {
  const ip = getRequestIP(event, { xForwardedFor: true })
  const userAgent = getHeader(event, 'user-agent')
  if (!ip && !userAgent) return null
  const domain = getHeader(event, 'host') || 'localhost'
  return createHash('sha256').update(`${domain}+${ip ?? ''}+${userAgent ?? ''}`).digest('hex')
}
