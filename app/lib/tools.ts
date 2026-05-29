import Realm from '../models/Realm'
import Quest from '../models/Quest'

export async function getRealmState(userId: string) {
    return await Realm.findOne({ userId })
}

export async function saveQuest(data: any) {
    return await Quest.create(data)
}

export async function completeQuest(id: string) {
    return await Quest.findByIdAndUpdate(id, {
        completed: true,
    })
}