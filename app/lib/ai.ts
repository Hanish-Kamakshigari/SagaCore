'use server'

// lib/ai.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Gemini API calls route through server-side fetch (Next.js Server Actions).
// Never call the Gemini API directly from the browser — CORS will block it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Quest, LoreChapter } from './data'
import { connectDB, QuestModel, LoreChapterModel, PlayerStateModel } from './mongodb'

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function callGemini(payload: any): Promise<string> {
  const systemPrompt = payload.system || ''
  const messages = payload.messages || []
  
  // Format the messages for Gemini:
  // contents: [ { role: 'user' | 'model', parts: [ { text: string } ] } ]
  const contents = messages.map((m: any) => {
    let role = m.role
    if (role === 'assistant' || role === 'system') {
      role = 'model'
    } else if (role !== 'model' && role !== 'user') {
      role = 'user'
    }
    return {
      role: role,
      parts: [{ text: m.content || '' }]
    }
  })

  const body: any = {
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    }
  }

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }]
    }
  }
  // Use the standard Gemini model
  let model = payload.model || 'gemini-2.5-flash'
  if (model.includes('llama') || model.includes('versatile') || model.includes('gemini-1.5-flash') || model.includes('gemini-3.5-flash')) {
    model = 'gemini-2.5-flash'
  }

  const maxRetries = 3
  let delay = 1000 // initial delay of 1 second

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const status = response.status
        const shouldRetry = status === 429 || status === 503 || status === 500 || status === 502 || status === 504

        if (shouldRetry && attempt <= maxRetries) {
          console.warn(`Gemini API call failed with status ${status} (Attempt ${attempt}/${maxRetries + 1}). Retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          delay *= 2 // exponential backoff
          continue
        }

        throw new Error(`Gemini API error ${response.status}: ${JSON.stringify(err)}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      return text
    } catch (error: any) {
      // If it's a fetch network error or transient code, retry if we have attempts left
      const isNetworkError = error instanceof TypeError || error.name === 'TypeError'
      const isTransientError = error.message?.includes('503') || error.message?.includes('429') || error.message?.includes('500')
      
      if ((isNetworkError || isTransientError) && attempt <= maxRetries) {
        console.warn(`Gemini API network/transient error (Attempt ${attempt}/${maxRetries + 1}): ${error.message || error}. Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // exponential backoff
        continue
      }
      throw error
    }
  }

  throw new Error('Gemini API call failed after max retries')
}

// ─── Shared JSON parser ───────────────────────────────────────────────────────

function parseJSON<T>(raw: string): T {
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean) as T
}

// ─── Dream Engine ─────────────────────────────────────────────────────────────

export async function forgeQuestWithAI(
  goal: string,
  newId: number,
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk'
): Promise<Quest> {
  const themeContext = {
    fantasy:   'a high-fantasy realm of mana, spires, and ancient scrolls',
    cyberpunk: 'a neon-lit cyberpunk grid of memory overflows and terminal nets',
    steampunk: 'a steampunk empire of pressure gauges, clockwork cores, and steam valves',
  }[worldTheme]

  const raw = await callGemini({
    model: 'gemini-1.5-flash',
    max_tokens: 1000,
    system: `You are the Dream Engine of SAGACORE — a system set in ${themeContext}.
You transform real-life goals into mythic quests.
Respond ONLY with valid JSON matching this exact shape — no prose, no markdown fences:
{
  "title": "Quest title (4-7 words) highly specific to the actual goal",
  "description": "1-2 sentences describing the quest and detailing the actual real-world goal with an epic, thematic flair",
  "category": "wisdom" | "discipline" | "creation",
  "difficulty": "Common" | "Rare" | "Epic" | "Legendary",
  "xp": number between 50 and 300,
  "tasks": ["Main actionable task | Thematic lore subtitle", "Main actionable task | Thematic lore subtitle"],
  "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
}
Rules:
- Difficulty and XP must reflect actual effort: learning DSA = Epic 200xp, daily walk = Common 60xp
- CRITICAL: The quest "title" and "description" MUST BE REALISTIC and highly specific to the user's actual real-world goal (e.g. if the goal is "build a RAG system", the title should be "Build the RAG System" or "Design Vector Indexes", NOT a generic template like "Gather Ancient Lore" or "Craft Resilient Artifacts"). Incorporate the real-world technologies, terms, or activities directly into the title and description, while dressing them up with a subtle, immersive mythic tone.
- CRITICAL: Each item inside the "tasks" array MUST contain a short, 100% real-world actionable task (3-6 words, e.g. "Install auth package" or "Draft SQL schema") paired with an evocative, short fantasy/sci-fi theme lore subtitle (e.g. "Forge the aether shield" or "Decrypt the mainframe cache") separated strictly by a vertical pipe (" | "). Format exactly as: "Real Task | Fantasy Lore Subtitle". Do NOT use fictional items (like starlight ore or mana crystals) inside the real task part — fictional elements belong strictly in the lore subtitle, quest title, and description.
- mythEvent must feel emotionally significant — not generic`,
    messages: [{ role: 'user', content: `Goal: "${goal}"` }],
  })

  const parsed = parseJSON<any>(raw)

  return {
    id: newId,
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    difficulty: parsed.difficulty,
    xp: parsed.xp,
    tasks: parsed.tasks ?? [],
    mythEvent: parsed.mythEvent ?? '',
    isCompleted: false,
  }
}

export async function forgeQuestlineWithAI(
  goal: string,
  startId: number,
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk',
  playerLevel: number = 1
): Promise<Quest[]> {
  const themeContext = {
    fantasy:   'a high-fantasy realm of mana, spires, and ancient scrolls',
    cyberpunk: 'a neon-lit cyberpunk grid of memory overflows and terminal nets',
    steampunk: 'a steampunk empire of pressure gauges, clockwork cores, and steam valves',
  }[worldTheme]

  const raw = await callGemini({
    model: 'gemini-1.5-flash',
    max_tokens: 1500,
    system: `You are the Campaign Architect of SAGACORE set in ${themeContext}.
Given a user's master goal or ambition, decompose it into a legendary campaign consisting of EXACTLY 3 sequential, highly relevant quests.
Quest 1 should focus on learning/prep (wisdom category).
Quest 2 should focus on crafting/building (creation category).
Quest 3 should focus on testing/polishing/discipline (discipline category).

The user is currently Level ${playerLevel} in their SAGACORE journey. 
To emulate a true progressive game, scale the quest difficulty, task depth, and XP rewards dynamically based on this level:
- For levels 1-5 (Novice): Tasks must be simple, direct, and straightforward. Set difficulty to "Common" or "Rare". XP rewards must scale between 60 XP and 120 XP.
- For levels 6-12 (Expert): Tasks must represent solid multi-stage sub-projects. Set difficulty to "Rare" or "Epic". XP rewards must scale between 130 XP and 240 XP.
- For levels 13+ (Master): Tasks must demand granular, highly rigorous professional disciplines. Set difficulty to "Epic" or "Legendary". XP rewards must scale between 250 XP and 450 XP, representing their immense master-tier progress in the game!

Respond ONLY with a valid JSON object of this exact shape — no prose, no markdown fences:
{
  "quests": [
    {
      "title": "Quest title (4-7 words) highly specific to the actual goal and prep stage",
      "description": "1-2 sentences in thematic language detailing the specific real-world goal and prep step",
      "category": "wisdom",
      "difficulty": "Common" | "Rare" | "Epic" | "Legendary",
      "xp": number matching the level scaling rules above,
      "tasks": ["practical real-world step 1", "practical real-world step 2", "practical real-world step 3"],
      "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
    },
    {
      "title": "Quest title (4-7 words) highly specific to the actual goal and building stage",
      "description": "1-2 sentences in thematic language detailing the specific real-world goal and building step",
      "category": "creation",
      "difficulty": "Common" | "Rare" | "Epic" | "Legendary",
      "xp": number matching the level scaling rules above,
      "tasks": ["practical real-world step 1", "practical real-world step 2", "practical real-world step 3"],
      "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
    },
    {
      "title": "Quest title (4-7 words) highly specific to the actual goal and testing stage",
      "description": "1-2 sentences in thematic language detailing the specific real-world goal and testing step",
      "category": "discipline",
      "difficulty": "Common" | "Rare" | "Epic" | "Legendary",
      "xp": number matching the level scaling rules above,
      "tasks": ["practical real-world step 1", "practical real-world step 2", "practical real-world step 3"],
      "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
    }
  ]
}

Rules:
- CRITICAL: All quest "title" and "description" fields MUST BE REALISTIC, highly specific, and customized directly to the user's actual master goal (e.g. if the master goal is "build a RAG system", use titles like "Design RAG Architecture", "Construct Vector Database Indexes", "Evaluate Retrospective Retrieval" rather than generic placeholders like "Gather Ancient Lore" or "Craft Resilient Artifacts"). Incorporate the real-world technologies, terms, or activities directly into the titles and descriptions, while dressing them up with a subtle, immersive mythic/thematic tone.
- CRITICAL: Each item inside the "tasks" arrays MUST contain a short, 100% real-world actionable task (3-6 words, e.g. "Draft database schema" or "Write validation tests") paired with a short, evocative fantasy/sci-fi theme lore subtitle (e.g. "Secure the celestial archives" or "Imbue the core crystal") separated strictly by a vertical pipe (" | "). Format exactly as: "Real Task | Fantasy Lore Subtitle". Fictional and thematic metaphors must reside strictly inside the lore subtitle part, not the real task part.`,
    messages: [{ role: 'user', content: `Master Ambition: "${goal}"` }],
  })

  const parsed = parseJSON<{ quests: any[] }>(raw)
  return parsed.quests.map((q, idx) => ({
    id: startId + idx,
    title: q.title,
    description: q.description,
    category: q.category,
    difficulty: q.difficulty,
    xp: q.xp,
    tasks: q.tasks ?? [],
    completedTasks: new Array(q.tasks?.length ?? 0).fill(false),
    mythEvent: q.mythEvent ?? '',
    isCompleted: false,
    dependsOnQuestId: idx > 0 ? (startId + idx - 1) : undefined,
  }))
}

// ─── Adaptive AI Engine ────────────────────────────────────────────────────────

export async function generateAdaptiveChapter(
  questTitle: string,
  questCategory: string,
  worldTheme: string,
  chapterId: number,
  mythEvent: string
): Promise<LoreChapter> {
  const raw = await callGemini({
    model: 'gemini-1.5-flash',
    max_tokens: 1000,
    system: `You are the MythOS Narrative Engine — the scribe of SAGACORE.
When a hero completes or fails a quest, you write a legendary codex chapter
describing the world-altering consequences.
Respond ONLY with valid JSON — no prose, no markdown fences:
{
  "title": "Poetic chapter title (5-8 words)",
  "text": "3-4 sentence mythic narrative. Begin with the world reacting. End with a hint of what is now possible."
}
Rules:
- Ground the narrative in the actual quest achievement
- Make the world-change feel earned and emotionally resonant
- Avoid cliches like 'a new chapter begins' or 'the hero stood tall'`,
    messages: [{
      role: 'user',
      content: `Quest: "${questTitle}"
Category: ${questCategory}
World theme: ${worldTheme}
Myth event: "${mythEvent}"`,
    }],
  })

  const parsed = parseJSON<any>(raw)

  return {
    id: chapterId,
    title: parsed.title,
    text: parsed.text,
    timestamp: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  }
}

// ─── World Forge Engine ────────────────────────────────────────────────────────

export async function forgeCustomWorldWithAI(
  prompt: string
): Promise<{ name: string; lore: string; theme: 'fantasy' | 'cyberpunk' | 'steampunk' }> {
  const raw = await callGemini({
    model: 'gemini-1.5-flash',
    max_tokens: 1000,
    system: `You are the World Architect of SAGACORE.
Given a user's world prompt, name and describe a custom realm.
Respond ONLY with valid JSON — no prose, no markdown fences:
{
  "name": "Evocative realm name (2-5 words)",
  "lore": "1 sentence — the realm's defining characteristic",
  "theme": "fantasy" | "cyberpunk" | "steampunk"
}
Pick the theme that best matches the prompt's aesthetic.`,
    messages: [{ role: 'user', content: `World prompt: "${prompt}"` }],
  })

  return parseJSON(raw)
}

// ─── Memory Engine (MongoDB Persistence) ───────────────────────────────────────

export async function saveChapterToMongo(chapter: LoreChapter, userId: string): Promise<void> {
  try {
    await connectDB()
    await LoreChapterModel.findOneAndUpdate(
      { userId, id: chapter.id },
      {
        userId,
        title: chapter.title,
        text: chapter.text,
        timestamp: chapter.timestamp
      },
      { upsert: true, new: true }
    )
  } catch (error: any) {
    console.warn('Mongo Save Chapter Warning (Offline/Memory Mode):', error.message || error)
  }
}

export async function fetchChaptersFromMongo(userId: string): Promise<LoreChapter[]> {
  try {
    await connectDB()
    const chapters = await LoreChapterModel.find({ userId }).sort({ id: 1 }).lean()
    return chapters.map((c: any) => ({
      id: c.id,
      title: c.title,
      text: c.text,
      timestamp: c.timestamp
    }))
  } catch (error: any) {
    console.warn('Mongo Fetch Chapters Warning (Offline/Memory Mode):', error.message || error)
    return []
  }
}

export async function savePlayerStateToMongo(
  playerId: string,
  xp: number,
  level: number,
  worldTheme: string
): Promise<void> {
  try {
    await connectDB()
    await PlayerStateModel.findOneAndUpdate(
      { id: playerId },
      {
        xp,
        level,
        worldTheme,
        lastUpdated: new Date().toISOString()
      },
      { upsert: true, new: true }
    )
  } catch (error: any) {
    console.warn('Mongo Save Player State Warning (Offline/Memory Mode):', error.message || error)
  }
}

// ─── Quest Roadmap Engine ──────────────────────────────────────────────────────

export async function generateRoadmapForQuest(
  title: string,
  category: string,
  difficulty: string,
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk'
): Promise<{ tasks: string[]; mythEvent: string }> {
  const themeContext = {
    fantasy:   'a high-fantasy realm of mana, spires, and ancient scrolls',
    cyberpunk: 'a neon-lit cyberpunk grid of memory overflows and terminal nets',
    steampunk: 'a steampunk empire of pressure gauges, clockwork cores, and steam valves',
  }[worldTheme]

  const raw = await callGemini({
    model: 'gemini-1.5-flash',
    max_tokens: 1000,
    system: `You are the Quest Planner of SAGACORE set in ${themeContext}.
Create a highly practical, step-by-step roadmap (3-4 specific, doable tasks) and a world-altering mythEvent for this quest.
Respond ONLY with valid JSON — no prose, no markdown fences:
{
  "tasks": ["specific actionable task 1", "specific actionable task 2", "specific actionable task 3"],
  "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
}
Rules:
- CRITICAL: Each item inside the "tasks" array MUST contain a short, 100% real-world actionable task (3-6 words, e.g. "Draft SQL schema" or "Design authentication guard") paired with a short, evocative fantasy/sci-fi theme lore subtitle (e.g. "Forge the steam seal" or "Decrypt the neural net nodes") separated strictly by a vertical pipe (" | "). Format exactly as: "Real Task | Fantasy Lore Subtitle". Fictional and thematic metaphors must reside strictly inside the lore subtitle part, not the real task part.`,
    messages: [{
      role: 'user',
      content: `Quest: "${title}"
Category: ${category}
Difficulty: ${difficulty}`,
    }],
  })

  return parseJSON(raw)
}

export async function saveQuestToMongo(quest: Quest, userId: string) {
  try {
    await connectDB()

    console.log('Saving quest:', quest, 'for user:', userId)

    const updated = await QuestModel.findOneAndUpdate(
      { userId, id: quest.id },
      { ...quest, userId },
      {
        upsert: true,
        new: true,
      }
    ).lean()

    if (updated) {
      return JSON.parse(JSON.stringify(updated)) as Quest
    }
    return quest
  } catch (error: any) {
    console.warn('Mongo Save Quest Warning (Offline/Memory Mode):', error.message || error)
    // Return original quest to client to guarantee uninterrupted execution
    return quest
  }
}

export async function fetchQuestsFromMongo(userId: string): Promise<Quest[]> {
  try {
    await connectDB()
    const quests = await QuestModel.find({ userId }).sort({ id: 1 }).lean()
    return JSON.parse(JSON.stringify(quests)) as Quest[]
  } catch (error: any) {
    console.warn('Mongo Fetch Quests Warning (Offline/Memory Mode):', error.message || error)
    return []
  }
}

export async function fetchPlayerStateFromMongo(userId: string) {
  try {
    await connectDB()
    const state = await PlayerStateModel.findOne({ id: userId }).lean()
    if (state) {
      return JSON.parse(JSON.stringify(state))
    }
    return null
  } catch (error: any) {
    console.warn('Mongo Fetch Player State Warning (Offline/Memory Mode):', error.message || error)
    return null
  }
}