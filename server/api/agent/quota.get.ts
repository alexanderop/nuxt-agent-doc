import { getAgentQuota } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  return await getAgentQuota(event)
})
