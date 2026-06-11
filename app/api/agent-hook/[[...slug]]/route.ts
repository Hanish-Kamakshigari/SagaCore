import { NextResponse } from 'next/server'
import { getRealmState, completeQuest } from '@/app/lib/tools'
import { saveQuestToMongo, saveChapterToMongo } from '@/app/lib/ai'
import type { Quest, LoreChapter } from '@/app/lib/data'
import { checkRateLimit, getClientIp } from '@/app/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check
    const ip = getClientIp(request)
    const rateLimitResult = await checkRateLimit(ip)

    const headers = new Headers()
    headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString())

    if (!rateLimitResult.success) {
      console.warn(`[Agent Hook Webhook Warning] Rate limit exceeded for IP: ${ip}`)
      headers.set('Retry-After', Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString())
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429, headers })
    }

    // 2. Check authorization header
    const authHeader = request.headers.get('Authorization')
    const secret = process.env.API_ROUTE_SECRET
    
    if (secret) {
      if (!authHeader || authHeader !== `Bearer ${secret}`) {
        console.warn('[Agent Hook Webhook Warning] Unauthorized webhook call blocked.')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
      }
    } else {
      console.warn('[Agent Hook Webhook Warning] API_ROUTE_SECRET environment variable is not configured. Endpoint is running unprotected.')
    }

    const body = await request.json()
    console.log('[Agent Hook Webhook] Received webhook call from Google Cloud Agent Builder:', body)
    
    // Resolve operation name, parameters, and URL path
    const url = new URL(request.url)
    const reqPath = url.pathname
    const { operation, parameters } = body
    const op = operation || body.tag || ''
    const params = parameters || body.sessionInfo?.parameters || body
    
    let result: any = null
    
    if (op === 'getRealmState' || reqPath.includes('realm-state')) {
      const state = await getRealmState(params.userId)
      result = state ? JSON.parse(JSON.stringify(state)) : { error: "No realm state found" }
    } else if (op === 'completeQuest' || reqPath.includes('complete-quest')) {
      const completed = await completeQuest(params.id, params.userId)
      result = completed ? JSON.parse(JSON.stringify(completed)) : { error: "Quest not found" }
    } else if (op === 'saveQuestToDatabase' || reqPath.includes('save-quest')) {
      const quest: Quest = {
        id: Number(params.id),
        title: params.title,
        description: params.description,
        category: params.category as any,
        difficulty: params.difficulty as any,
        xp: Number(params.xp),
        tasks: params.tasks || [],
        mythEvent: params.mythEvent || '',
        isCompleted: false,
      }
      await saveQuestToMongo(quest, params.userId)
      result = quest
    } else if (op === 'saveChapterToDatabase' || reqPath.includes('save-chapter')) {
      const chapter: LoreChapter = {
        id: Number(params.id),
        title: params.title,
        text: params.text,
        timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      }
      await saveChapterToMongo(chapter, params.userId)
      result = chapter
    } else {
      return NextResponse.json({ error: `Unknown operation: ${op} at path ${reqPath}` }, { status: 400, headers })
    }
    
    return NextResponse.json(result, { headers })
  } catch (error: any) {
    console.error('[Agent Hook Webhook Error] Webhook execution failed:', error)
    return NextResponse.json({ error: error.message || 'Webhook execution failed' }, { status: 500 })
  }
}
