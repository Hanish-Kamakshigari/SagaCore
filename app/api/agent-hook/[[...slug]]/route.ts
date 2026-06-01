import { NextResponse } from 'next/server'
import { getRealmState, completeQuest } from '@/app/lib/tools'
import { saveQuestToMongo, saveChapterToMongo } from '@/app/lib/ai'
import type { Quest, LoreChapter } from '@/app/lib/data'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('🤖 [Agent Hook Webhook] Received webhook call from Google Cloud Agent Builder:', body)
    
    // Resolve operation name and parameters from the Agent Builder payload
    const { operation, parameters } = body
    const op = operation || body.tag || ''
    const params = parameters || body.sessionInfo?.parameters || body
    
    let result: any = null
    
    if (op === 'getRealmState' || body.path?.includes('realm-state')) {
      const state = await getRealmState(params.userId)
      result = state ? JSON.parse(JSON.stringify(state)) : { error: "No realm state found" }
    } else if (op === 'completeQuest' || body.path?.includes('complete-quest')) {
      const completed = await completeQuest(params.id, params.userId)
      result = completed ? JSON.parse(JSON.stringify(completed)) : { error: "Quest not found" }
    } else if (op === 'saveQuestToDatabase' || body.path?.includes('save-quest')) {
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
    } else if (op === 'saveChapterToDatabase' || body.path?.includes('save-chapter')) {
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
      return NextResponse.json({ error: `Unknown operation: ${op}` }, { status: 400 })
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ [Agent Hook Webhook Error] Webhook execution failed:', error)
    return NextResponse.json({ error: error.message || 'Webhook execution failed' }, { status: 500 })
  }
}
