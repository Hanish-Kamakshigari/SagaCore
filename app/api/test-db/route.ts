import { NextResponse } from 'next/server'
import { connectDB, QuestModel, LoreChapterModel, PlayerStateModel } from '@/app/lib/mongodb'
import { checkRateLimit, getClientIp } from '@/app/lib/rate-limit'

export async function GET(request: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = getClientIp(request)
    const rateLimitResult = await checkRateLimit(ip)

    const headers = new Headers()
    headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    if (!rateLimitResult.success) {
      console.warn(`[Test DB Warning] Rate limit exceeded for IP: ${ip}`)
      headers.set('Retry-After', Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString())
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers })
    }

    // 2. Restrict access in production unless the correct authorization token is provided
    if (process.env.NODE_ENV !== 'development') {
      const authHeader = request.headers.get('Authorization')
      const secret = process.env.API_ROUTE_SECRET
      if (!secret || authHeader !== `Bearer ${secret}`) {
        console.warn('[Test DB Warning] Unauthorized database lookup attempt blocked.')
        return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers })
      }
    }

    await connectDB()

    const quests = await QuestModel.find({}).lean()
    const chapters = await LoreChapterModel.find({}).lean()
    const players = await PlayerStateModel.find({}).lean()

    return NextResponse.json({
      status: 'connected',
      counts: {
        quests: quests.length,
        chapters: chapters.length,
        players: players.length,
      },
      quests,
      chapters,
      players,
    }, { headers })
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}