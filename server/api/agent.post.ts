import {
  streamText,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  stepCountIs
} from 'ai'
import type { ToolSet, UIMessage } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { sql } from 'drizzle-orm'
import { createAILogger, createEvlogIntegration } from 'evlog/ai'
import { useLogger } from 'evlog'
import { buildSystemPrompt } from '../utils/system-prompt'
import { contentTools } from '../utils/tools'
import { showPostTool } from '../utils/tools/show-post'
import { codeTool } from '../utils/tools/code'
import { getAgentFingerprint } from '../utils/agent-fingerprint'
import { consumeAgentRateLimit } from '../utils/rate-limit'
import { db, schema } from '../db/client'
import { isAgentMode, type AgentMode } from '~~/shared/agent'

const MAX_STEPS = 8
const MODEL = anthropic('claude-sonnet-4-6')

const CLASSICAL_TOOLS: ToolSet = { ...contentTools, show_post: showPostTool }
const CODE_TOOLS: ToolSet = { code: codeTool, show_post: showPostTool }

export default defineEventHandler(async (event) => {
  await consumeAgentRateLimit(event)

  const raw = await readBody<{ id?: unknown, messages?: unknown, mode?: unknown }>(event)
  const validated = await safeValidateUIMessages({ messages: raw?.messages })
  if (!validated.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid messages' })
  }

  const chatId = typeof raw?.id === 'string' ? raw.id : null
  const mode: AgentMode = isAgentMode(raw?.mode) ? raw.mode : 'classical'
  const pagePath = getHeader(event, 'x-page-path')?.trim() ?? null

  const log = useLogger(event)
  const ai = createAILogger(log, {
    toolInputs: true,
    cost: { 'claude-sonnet-4-6': { input: 3, output: 15 } }
  })

  const abort = new AbortController()
  event.node.req.once('close', () => abort.abort())

  const saveChat = async (finalizedMessages: UIMessage[]) => {
    if (!chatId) return
    const fingerprint = getAgentFingerprint(event)
    if (!fingerprint) return
    const now = new Date()
    const { inputTokens, outputTokens, estimatedCost = 0, totalDurationMs = 0 } = ai.getMetadata()

    await db.insert(schema.agentChats).values({
      id: chatId,
      messages: finalizedMessages,
      fingerprint,
      mode,
      inputTokens,
      outputTokens,
      estimatedCost,
      durationMs: totalDurationMs,
      requestCount: 1,
      createdAt: now,
      updatedAt: now
    }).onConflictDoUpdate({
      target: schema.agentChats.id,
      set: {
        messages: finalizedMessages,
        updatedAt: now,
        inputTokens: sql`${schema.agentChats.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${schema.agentChats.outputTokens} + ${outputTokens}`,
        estimatedCost: sql`${schema.agentChats.estimatedCost} + ${estimatedCost}`,
        durationMs: sql`${schema.agentChats.durationMs} + ${totalDurationMs}`,
        requestCount: sql`${schema.agentChats.requestCount} + 1`
      },
      where: sql`${schema.agentChats.fingerprint} = ${fingerprint}`
    })
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model: ai.wrap(MODEL),
        maxOutputTokens: 2000,
        abortSignal: abort.signal,
        stopWhen: stepCountIs(MAX_STEPS),
        system: buildSystemPrompt(pagePath, mode),
        messages: await convertToModelMessages(validated.data),
        tools: mode === 'code' ? CODE_TOOLS : CLASSICAL_TOOLS,
        experimental_telemetry: {
          isEnabled: true,
          integrations: [createEvlogIntegration(ai)]
        }
      })
      writer.merge(result.toUIMessageStream({
        originalMessages: validated.data,
        onFinish: ({ messages: finalizedMessages }) => {
          event.waitUntil(saveChat(finalizedMessages))
        }
      }))
    }
  })
  return createUIMessageStreamResponse({ stream })
})
