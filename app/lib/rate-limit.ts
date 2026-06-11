// app/lib/rate-limit.ts

type RateLimitRecord = {
  timestamps: number[]
}

// Global in-memory map to track request timestamps per client IP.
// Note: In serverless environments, this maps persists for the lifetime of the server container instance.
const tracker = new Map<string, RateLimitRecord>()

/**
 * Extracts client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) {
    return xRealIp.trim()
  }
  return '127.0.0.1'
}

/**
 * Validates request count against limit within the time window.
 */
export async function checkRateLimit(ip: string): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const limit = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 30
  const windowMs = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 60000

  const now = Date.now()
  const record = tracker.get(ip) || { timestamps: [] }

  // Filter out timestamps outside the sliding time window
  const validTimestamps = record.timestamps.filter(t => now - t < windowMs)

  if (validTimestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: validTimestamps[0] + windowMs
    }
  }

  // Record the current request timestamp
  validTimestamps.push(now)
  tracker.set(ip, { timestamps: validTimestamps })

  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
    reset: now + windowMs
  }
}
