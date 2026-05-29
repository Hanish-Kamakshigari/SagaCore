import mongoose from 'mongoose'

const TaskSchema = new mongoose.Schema({
  title: String,

  completed: Boolean,
})

const QuestSchema = new mongoose.Schema({
  title: String,

  description: String,

  completed: Boolean,

  tasks: [TaskSchema],
})

export default mongoose.models.Quest ||
  mongoose.model('Quest', QuestSchema)
