import mongoose from 'mongoose'

// Disable query buffering globally so offline mode operations fail instantly instead of hanging for 10 seconds
mongoose.set('bufferCommands', false);

export async function connectDB() {
  // Read URI from environment variables (must be added in Vercel settings and redeployed)
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Missing MONGODB_URI env variable')
  }

  try {
    if (mongoose.connection.readyState >= 1) {
      console.log('[DB] Mongo already connected')
      return
    }

    console.log('[DB] Connecting to MongoDB...')

    await mongoose.connect(uri)

    console.log('[DB] MongoDB Connected Successfully!')
  } catch (error) {
    console.error('[DB Error] MongoDB Connection Error:', error)
    throw error
  }
}

const QuestSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: Number, required: true },
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
  dependsOnQuestId: { type: Number },
  deadline: { type: String },
  createdAtString: { type: String }
}, { timestamps: true })

QuestSchema.index({ userId: 1, id: 1 }, { unique: true })

const LoreChapterSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: Number, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { timestamps: true })

LoreChapterSchema.index({ userId: 1, id: 1 }, { unique: true })

const PlayerStateSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // id is the Firebase UID
  xp: { type: Number, required: true },
  level: { type: Number, required: true },
  worldTheme: { type: String, required: true },
  worldName: { type: String }, // Custom realm name
  email: { type: String }, // Optional email field for leaderboard display names
  displayName: { type: String }, // Custom scribe handle/display name
  stability: { type: Number, default: 100 },
  streak: { type: Number, default: 0 },
  lastDailyChallengeDate: { type: String },
  lastActiveDate: { type: String },
  lastUpdated: { type: String, required: true }
}, { timestamps: true })

export const QuestModel = mongoose.models.Quest || mongoose.model('Quest', QuestSchema)
export const LoreChapterModel = mongoose.models.LoreChapter || mongoose.model('LoreChapter', LoreChapterSchema)
export const PlayerStateModel = mongoose.models.PlayerState || mongoose.model('PlayerState', PlayerStateSchema)
