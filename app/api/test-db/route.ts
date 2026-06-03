import { NextResponse } from 'next/server'
import { connectDB, QuestModel, LoreChapterModel, PlayerStateModel } from '@/app/lib/mongodb'

export async function GET() {
  try {
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
    })
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}