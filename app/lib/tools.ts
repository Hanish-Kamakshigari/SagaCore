import { QuestModel, PlayerStateModel, connectDB } from './mongodb'

export async function getRealmState(userId: string) {
  await connectDB()
  let state = await PlayerStateModel.findOne({ id: userId })
  if (!state) {
    console.log(`[INFO] Auto-initializing default Level 1 player state for new user: ${userId}`)
    state = await PlayerStateModel.create({
      id: userId,
      xp: 0,
      level: 1,
      worldTheme: 'Sanctum of Aetheria',
      lastUpdated: new Date().toLocaleDateString('en-US')
    })
  }
  return state
}

export async function saveQuest(data: any) {
  await connectDB()
  return await QuestModel.create(data)
}

export async function completeQuest(id: string, userId: string) {
  await connectDB()
  return await QuestModel.findOneAndUpdate(
    { id: Number(id), userId },
    { isCompleted: true },
    { new: true }
  )
}