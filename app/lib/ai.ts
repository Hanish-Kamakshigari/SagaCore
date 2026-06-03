'use server'

// lib/ai.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Gemini API calls route through server-side fetch (Next.js Server Actions).
// Never call the Gemini API directly from the browser — CORS will block it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Quest, LoreChapter } from './data'
import { connectDB, QuestModel, LoreChapterModel, PlayerStateModel } from './mongodb'
import { getRealmState, saveQuest, completeQuest } from './tools'

// ─── Google Cloud Agent Builder Integration ──────────────────────────────────

async function getGCPAuthToken(): Promise<string> {
  const email = process.env.GCP_CLIENT_EMAIL || ''
  const privateKey = (process.env.GCP_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  
  if (!email || !privateKey) {
    throw new Error('GCP Service Account credentials (GCP_CLIENT_EMAIL / GCP_PRIVATE_KEY) are missing in environment.')
  }
  
  // Dynamic native JWT signing for Google Cloud Platform services
  const crypto = await import('crypto')
  const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' })
  
  const now = Math.floor(Date.now() / 1000)
  const claimSet = JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  })
  
  const base64UrlEncode = (str: string) => 
    Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
  const signatureInput = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signatureInput)
  const signature = sign.sign(privateKey, 'base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    
  const jwt = `${signatureInput}.${signature}`
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  })
  
  if (!tokenResponse.ok) {
    const err = await tokenResponse.json().catch(() => ({}))
    throw new Error(`Failed to exchange Google OAuth token: ${JSON.stringify(err)}`)
  }
  
  const data = await tokenResponse.json()
  return data.access_token
}

async function callAgentBuilder(payload: any): Promise<string> {
  const gcpProject = process.env.GCP_PROJECT_ID || ''
  const gcpAgent = process.env.GCP_AGENT_ID || ''
  const gcpLocation = process.env.GCP_LOCATION || 'global'
  
  const token = await getGCPAuthToken()
  
  const messages = payload.messages || []
  const lastMessage = messages[messages.length - 1]?.content || ''
  
  const sessionId = 'sagacore-session-' + (payload.userId || 'default-user')
  const url = `https://${gcpLocation}-dialogflow.googleapis.com/v3/projects/${gcpProject}/locations/${gcpLocation}/agents/${gcpAgent}/sessions/${sessionId}:detectIntent`
  
  const body = {
    queryInput: {
      text: {
        text: lastMessage
      },
      languageCode: 'en'
    }
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`GCP Agent Builder error ${response.status}: ${JSON.stringify(err)}`)
  }
  
  const data = await response.json()
  const messagesList = data.queryResult?.responseMessages || []
  let finalResponse = ''
  
  for (const msg of messagesList) {
    if (msg.text?.text?.[0]) {
      finalResponse += msg.text.text[0]
    }
  }
  
  return finalResponse || JSON.stringify(data)
}

function extractJSONString(str: string): string {
  const firstBrace = str.indexOf('{')
  const lastBrace = str.lastIndexOf('}')
  const firstBracket = str.indexOf('[')
  const lastBracket = str.lastIndexOf(']')

  let start = -1
  let end = -1

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace
    end = lastBrace
  } else if (firstBracket !== -1) {
    start = firstBracket
    end = lastBracket
  }

  if (start !== -1 && end !== -1 && end > start) {
    return str.substring(start, end + 1)
  }

  return str.replace(/```json|```/g, '').trim()
}

function isValidJSON(str: string): boolean {
  try {
    const clean = extractJSONString(str)
    JSON.parse(clean)
    return true
  } catch {
    return false
  }
}

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function callGemini(payload: any): Promise<string> {
  // If Agent Builder is fully configured in .env, route to Agent Builder provider!
  if (process.env.GCP_PROJECT_ID && process.env.GCP_AGENT_ID) {
    try {
      console.log('🤖 [Agent Provider] Delegating query to Google Cloud Agent Builder...')
      const result = await callAgentBuilder(payload)
      
      // Since SAGACORE's core engines expect structured JSON payloads to save into MongoDB,
      // verify if the response is valid JSON. If the Agent Builder returned conversational prose,
      // trigger the fallback to direct Gemini API generation for app stability.
      if (isValidJSON(result)) {
        return result
      } else {
        throw new Error(`Agent Builder returned natural language dialog instead of structured JSON. Response: "${result.substring(0, 150)}${result.length > 150 ? '...' : ''}"`)
      }
    } catch (err: any) {
      console.warn('⚠️ [Agent Provider Warning] GCP Agent Builder failed or returned non-JSON, cascading to local Gemini fallback:', err.message || err)
    }
  }

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

    if (m.parts) {
      return { role, parts: m.parts }
    }

    const parts: any[] = []
    if (m.functionCall) {
      parts.push({ functionCall: m.functionCall })
    } else if (m.functionResponse) {
      parts.push({ functionResponse: m.functionResponse })
    } else {
      parts.push({ text: m.content || '' })
    }

    return {
      role: role,
      parts
    }
  })

  const dbTools = [
    {
      functionDeclarations: [
        {
          name: "saveQuestToDatabase",
          description: "Autonomously saves a newly forged quest or quest campaign steps into the persistent MongoDB memory layer for the player.",
          parameters: {
            type: "OBJECT",
            properties: {
              userId: { type: "STRING", description: "The active Firebase user ID" },
              id: { type: "INTEGER", description: "The unique integer ID of the quest" },
              title: { type: "STRING", description: "Quest title highly specific to the actual goal" },
              description: { type: "STRING", description: "Thematic description of the quest" },
              category: { type: "STRING", enum: ["wisdom", "discipline", "creation"] },
              difficulty: { type: "STRING", enum: ["Common", "Rare", "Epic", "Legendary"] },
              xp: { type: "INTEGER", description: "XP reward points" },
              tasks: { type: "ARRAY", items: { type: "STRING" }, description: "Specific checklist tasks formatted exactly as 'Real Task | Fantasy Lore Subtitle'" },
              mythEvent: { type: "STRING", description: "World narrative consequence on completion" }
            },
            required: ["userId", "id", "title", "description", "category", "difficulty", "xp", "tasks"]
          }
        },
        {
          name: "saveChapterToDatabase",
          description: "Autonomously writes a newly chronicled lore chapter into the persistent MongoDB memory layer for the player.",
          parameters: {
            type: "OBJECT",
            properties: {
              userId: { type: "STRING", description: "The active Firebase user ID" },
              id: { type: "INTEGER", description: "Unique chapter index" },
              title: { type: "STRING", description: "Poetic chapter title" },
              text: { type: "STRING", description: "3-4 sentence chronicle narrative of world-changing achievements" }
            },
            required: ["userId", "id", "title", "text"]
          }
        },
        {
          name: "getRealmState",
          description: "Reads the player's current realm state (XP, level, active theme) from the database to adapt the narrative and scale quest difficulties.",
          parameters: {
            type: "OBJECT",
            properties: {
              userId: { type: "STRING", description: "The active Firebase user ID" }
            },
            required: ["userId"]
          }
        },
        {
          name: "completeQuest",
          description: "Marks a specific quest as completed in the database by its unique ID for a specific user.",
          parameters: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING", description: "The unique ID of the quest to mark as completed" },
              userId: { type: "STRING", description: "The active Firebase user ID" }
            },
            required: ["id", "userId"]
          }
        }
      ]
    }
  ]

  let currentContents = [...contents]
  let lastWriteToolOutput: string | null = null
  let loopCount = 0
  const maxLoops = 5

  while (loopCount < maxLoops) {
    loopCount++
    const body: any = {
      contents: currentContents,
      tools: dbTools,
      generationConfig: {
        temperature: 0.7,
      }
    }

    if (systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: systemPrompt + "\nCRITICAL: If you need to read the player state or persistently store a quest or chronicle chapter in the database, invoke the corresponding database tool directly. Otherwise, respond only in valid JSON format." }]
      }
    }
    // Use the standard Gemini model (upgraded to 2.5-flash due to deprecation of 1.5 series on June 1, 2026)
    let model = payload.model || 'gemini-2.5-flash'
    if (model.includes('llama') || model.includes('versatile') || model.includes('gemini-1.5-flash')) {
      model = 'gemini-2.5-flash'
    }

    const maxRetries = 3
    let delay = 1000 // initial delay of 1 second
    let data: any = null

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      // Cascading Fallback: on retry attempts (from 503 high demand or 429), fall back to gemini-2.5-pro to bypass quota/spikes!
      let currentModel = model
      if (attempt > 1) {
        currentModel = 'gemini-2.5-pro'
      }
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${process.env.GOOGLE_API_KEY || ''}`, {
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

        data = await response.json()
        break
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

    if (!data) {
      throw new Error('Gemini API call failed after max retries')
    }

    const candidate = data.candidates?.[0]
    const part = candidate?.content?.parts?.[0]

    if (part?.functionCall) {
      const { name, args } = part.functionCall
      console.log(`🤖 [Agentic Tool Use] Gemini Model autonomously invoked database tool: ${name}`, args)

      let resultObj: any = null
      let isWriteTool = false

      try {
        if (name === "getRealmState") {
          const state = await getRealmState(args.userId)
          resultObj = state ? JSON.parse(JSON.stringify(state)) : { error: "No realm state found" }
        } else if (name === "completeQuest") {
          const completed = await completeQuest(args.id, args.userId)
          resultObj = completed ? JSON.parse(JSON.stringify(completed)) : { error: "Quest not found" }
          isWriteTool = true
        } else if (name === "saveQuestToDatabase") {
          const quest: Quest = {
            id: Number(args.id),
            title: args.title,
            description: args.description,
            category: args.category as any,
            difficulty: args.difficulty as any,
            xp: Number(args.xp),
            tasks: args.tasks || [],
            mythEvent: args.mythEvent || '',
            isCompleted: false,
          }
          await saveQuestToMongo(quest, args.userId)
          resultObj = quest
          isWriteTool = true
        } else if (name === "saveChapterToDatabase") {
          const chapter: LoreChapter = {
            id: Number(args.id),
            title: args.title,
            text: args.text,
            timestamp: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          }
          await saveChapterToMongo(chapter, args.userId)
          resultObj = chapter
          isWriteTool = true
        }
      } catch (err: any) {
        console.error(`❌ [Agentic Tool Use Error] Failed to execute tool ${name}:`, err)
        resultObj = { error: err.message || "Execution failed" }
      }

      currentContents.push({
        role: 'model',
        parts: [{ functionCall: { name, args } }]
      })

      currentContents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name,
            response: { output: resultObj }
          }
        }]
      })

      if (isWriteTool) {
        lastWriteToolOutput = JSON.stringify(resultObj)
      }

      // Continue ReAct loop so Gemini can generate the next narrative/quests or invoke another tool!
      continue
    }

    const text = part?.text ?? ''
    if (!text.trim() && lastWriteToolOutput) {
      return lastWriteToolOutput
    }
    return text
  }

  throw new Error('Gemini API call failed: ReAct loop max iterations reached')
}

// ─── Shared JSON parser ───────────────────────────────────────────────────────

function parseJSON<T>(raw: string): T {
  const clean = extractJSONString(raw)
  return JSON.parse(clean) as T
}

// ─── Dream Engine ─────────────────────────────────────────────────────────────

export async function forgeQuestWithAI(
  goal: string,
  newId: number,
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk',
  userId?: string
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
    messages: [{ role: 'user', content: `Goal: "${goal}"${userId ? `, Player User ID: "${userId}"` : ''}` }],
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
  playerLevel: number = 1,
  userId?: string
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
    messages: [{ role: 'user', content: `Master Ambition: "${goal}"${userId ? `, Player User ID: "${userId}"` : ''}` }],
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
  mythEvent: string,
  userId?: string
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
Myth event: "${mythEvent}"${userId ? `\nPlayer User ID: "${userId}"` : ''}`,
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