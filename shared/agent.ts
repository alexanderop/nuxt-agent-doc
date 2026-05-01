export type AgentMode = 'classical' | 'code'

export function isAgentMode(value: unknown): value is AgentMode {
  return value === 'classical' || value === 'code'
}

export type ModeAggregate = {
  mode: AgentMode
  chats: number
  requests: number
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  durationMs: number
}

export function emptyAggregate(mode: AgentMode): ModeAggregate {
  return { mode, chats: 0, requests: 0, inputTokens: 0, outputTokens: 0, estimatedCost: 0, durationMs: 0 }
}

export const AGENT_METRICS_KEY = 'agent-metrics'
