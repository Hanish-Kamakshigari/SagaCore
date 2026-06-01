import { QuestModel, PlayerStateModel, connectDB } from './mongodb'

export async function getRealmState(userId: string) {
  await connectDB()
  return await PlayerStateModel.findOne({ id: userId })
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