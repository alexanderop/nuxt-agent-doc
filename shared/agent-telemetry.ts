import type { UIMessage } from 'ai'

export type TurnMetrics = {
  steps: number
  tools: number
  elapsedMs: number
  inputTokens: number
  outputTokens: number
  estimatedCost: number
}

export type SubToolCall = {
  codeToolCallId: string
  seq: number
  name: string
  startedAt: number
  endedAt?: number
  resultSummary?: string
}

export const TURN_METRICS_PART_TYPE = 'data-turn-metrics' as const
export const SUBTOOL_CALL_PART_TYPE = 'data-subtool-call' as const

type TurnMetricsPart = { type: typeof TURN_METRICS_PART_TYPE, id?: string, data: TurnMetrics }
type SubToolCallPart = { type: typeof SUBTOOL_CALL_PART_TYPE, id?: string, data: SubToolCall }

function isTurnMetricsPart(part: UIMessage['parts'][number]): part is TurnMetricsPart {
  return part.type === TURN_METRICS_PART_TYPE
}

export function isSubToolCallPart(part: UIMessage['parts'][number]): part is SubToolCallPart {
  return part.type === SUBTOOL_CALL_PART_TYPE
}

export function readLatestTurnMetrics(message: UIMessage | null): TurnMetrics | null {
  if (!message) return null
  for (let i = message.parts.length - 1; i >= 0; i--) {
    const part = message.parts[i]
    if (part && isTurnMetricsPart(part)) return part.data
  }
  return null
}
