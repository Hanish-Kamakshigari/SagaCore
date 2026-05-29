import mongoose from 'mongoose'

// Disable query buffering globally so offline mode operations fail instantly instead of hanging for 10 seconds
mongoose.set('bufferCommands', false);

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Missing MongoDB URI')
}

export async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log('✅ Mongo already connected')
      return
    }

    console.log('⏳ Connecting to MongoDB...')

    await mongoose.connect(MONGODB_URI)

    console.log('✅ MongoDB Connected Successfully!')
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error)
  }
}

const QuestSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['wisdom', 'discipline', 'creation'] },
  difficulty: { type: String, required: true, enum: ['Common', 'Rare', 'Epic', 'Legendary'] },
  xp: { type: Number, required: true },
  isCompleted: { type: Boolean, required: true, default: false },
  tasks: { type: [String], default: [] },
  mythEvent: { type: String, default: '' },
  failed: { type: Boolean, default: false },
  completedTasks: { type: [Boolean], default: [] },
  dependsOnQuestId: { type: Number }
}, { timestamps: true })

const LoreChapterSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { timestamps: true })

const PlayerStateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  xp: { type: Number, required: true },
  level: { type: Number, required: true },
  worldTheme: { type: String, required: true },
  lastUpdated: { type: String, required: true }
}, { timestamps: true })

export const QuestModel = mongoose.models.Quest || mongoose.model('Quest', QuestSchema)
export const LoreChapterModel = mongoose.models.LoreChapter || mongoose.model('LoreChapter', LoreChapterSchema)
export const PlayerStateModel = mongoose.models.PlayerState || mongoose.model('PlayerState', PlayerStateSchema)
