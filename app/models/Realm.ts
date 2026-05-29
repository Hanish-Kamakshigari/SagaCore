import mongoose from 'mongoose'

const RealmSchema = new mongoose.Schema({
  userId: String,

  realmName: String,

  stability: {
    type: Number,
    default: 100,
  },

  loreHistory: [String],
})

export default mongoose.models.Realm ||
  mongoose.model('Realm', RealmSchema)
