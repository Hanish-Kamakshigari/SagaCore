'use server'

// lib/ai.ts
// ─────────────────────────────────────────────────────────────────────────────
// All Gemini API calls route through server-side fetch (Next.js Server Actions).
// Never call the Gemini API directly from the browser — CORS will block it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Quest, LoreChapter } from './data'
import { connectDB, QuestModel, LoreChapterModel, PlayerStateModel } from './mongodb'
import { getRealmState, saveQuest, completeQuest } from './tools'
import { cookies } from 'next/headers'
import { getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import './firebase-admin' // Trigger initialization side-effect

async function verifySessionToken(userIdParam: string): Promise<string> {
  if (
    userIdParam.startsWith('guest_') || 
    userIdParam.startsWith('mock_user_') || 
    userIdParam === 'demo_user' || 
    userIdParam === 'player_sagacore_default'
  ) {
    return userIdParam
  }

  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sagacore_session_token')?.value
    if (!sessionToken) {
      throw new Error('No session token cookie present.')
    }

    if (getApps().length === 0) {
      throw new Error('Firebase Admin SDK is not initialized (missing environment keys).')
    }

    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(sessionToken)
    if (decodedToken.uid !== userIdParam) {
      throw new Error(`Authentication identity mismatch: ${decodedToken.uid} vs ${userIdParam}`)
    }

    return decodedToken.uid
  } catch (error: any) {
    console.error('[Security Error] Session verification failed:', error.message || error)
    throw new Error('Unauthorized database access.')
  }
}

// ─── Google Cloud Agent Builder Integration ──────────────────────────────────

async function getGCPAuthToken(): Promise<string> {
  const email = (process.env.GCP_CLIENT_EMAIL || '').trim()
  let privateKey = (process.env.GCP_PRIVATE_KEY || '').trim()
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1)
  }
  privateKey = privateKey.replace(/\\n/g, '\n')
  
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

async function callGroq(systemPrompt: string, messages: any[] = []): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in the environment')
  }

  // Map roles and content formats from Gemini to OpenAI/Groq standards
  const mappedMessages: any[] = []
  if (systemPrompt) {
    mappedMessages.push({ role: 'system', content: systemPrompt })
  }

  for (const m of messages) {
    let textContent = ''
    if (typeof m.content === 'string') {
      textContent = m.content
    } else if (m.parts && Array.isArray(m.parts)) {
      textContent = m.parts.map((p: any) => p.text || '').join('\n')
    } else if (m.parts && typeof m.parts === 'object') {
      textContent = (m.parts as any).text || ''
    }

    mappedMessages.push({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: textContent
    })
  }

  console.log('[AI Engine] Delegating prompt execution to Groq API (Llama 3.3)...')
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: mappedMessages,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`Groq API failure ${response.status}: ${JSON.stringify(err)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function callGemini(payload: any): Promise<string> {
  // If Agent Builder is fully configured in .env, route to Agent Builder provider!
  if (process.env.GCP_PROJECT_ID && process.env.GCP_AGENT_ID) {
    try {
      console.log('[Agent Provider] Delegating query to Google Cloud Agent Builder...')
      const result = await callAgentBuilder(payload)
      
      const systemPrompt = payload.system || ''
      const expectsJSON = payload.expectsJSON !== undefined
        ? payload.expectsJSON
        : (systemPrompt.toLowerCase().includes('json') || systemPrompt.toLowerCase().includes('object') || systemPrompt.toLowerCase().includes('array'))

      // Since SAGACORE's core engines expect structured JSON payloads to save into MongoDB,
      // verify if the response is valid JSON. If the call does not expect JSON (e.g. conversational chat),
      // we bypass the validation and return the Agent Builder response directly.
      if (!expectsJSON || isValidJSON(result)) {
        return result
      } else {
        throw new Error(`Agent Builder returned conversational dialog instead of structured JSON. Response: "${result.substring(0, 150)}${result.length > 150 ? '...' : ''}"`)
      }
    } catch (err: any) {
      console.warn('[Agent Provider Warning] GCP Agent Builder failed or returned non-JSON, cascading to local Gemini fallback:', err.message || err)
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

  // noTools mode: skip agentic loop entirely, just do a single clean Gemini call
  if (payload.noTools) {
    let model = 'gemini-2.5-flash'
    const body: any = {
      contents,
      generationConfig: { temperature: 0.7 },
    }
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] }
    }
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY || ''}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      )
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Gemini noTools error ${response.status}: ${JSON.stringify(err)}`)
      }
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } catch (noToolsError: any) {
      if (process.env.GROQ_API_KEY) {
        console.warn(`[AI Engine] Gemini noTools call failed, falling back to Groq: ${noToolsError.message}`)
        return await callGroq(systemPrompt, payload.messages)
      }
      throw noToolsError
    }
  }

  let currentContents = [...contents]
  let lastWriteToolOutput: string | null = null
  let loopCount = 0
  const maxLoops = 5

  try {
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
      let currentModel = model
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
      console.log(`[Agentic Tool Use] Gemini Model autonomously invoked database tool: ${name}`, args)

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
        console.error(`[Agentic Tool Use Error] Failed to execute tool ${name}:`, err)
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
  } catch (geminiError: any) {
    if (process.env.GROQ_API_KEY) {
      try {
        console.warn(`[AI Engine] Gemini API failed (${geminiError.message || geminiError}). Attempting tertiary fallback via Groq API...`)
        const groqResult = await callGroq(systemPrompt, payload.messages)
        return groqResult
      } catch (groqError: any) {
        console.error(`[AI Engine] Groq fallback also failed: ${groqError.message || groqError}`)
        throw geminiError
      }
    } else {
      throw geminiError
    }
  }
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
  userId?: string,
  categoryOverride?: 'wisdom' | 'discipline' | 'creation',
  durationDays: number = 3
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
  "category": "${categoryOverride || 'wisdom\" | \"discipline\" | \"creation'}",
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
  const now = new Date()
  const deadline = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  return {
    id: newId,
    title: parsed.title,
    description: parsed.description,
    category: categoryOverride || parsed.category || 'discipline',
    difficulty: parsed.difficulty,
    xp: parsed.xp,
    tasks: parsed.tasks ?? [],
    completedTasks: new Array(parsed.tasks?.length ?? 0).fill(false),
    mythEvent: parsed.mythEvent ?? '',
    isCompleted: false,
    createdAtString: now.toISOString(),
    deadline: deadline.toISOString(),
  }
}

export async function forgeQuestlineWithAI(
  goal: string,
  startId: number,
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk',
  playerLevel: number = 1,
  userId?: string,
  durationDays: number = 3
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
  const now = new Date()

  return parsed.quests.map((q, idx) => {
    // Stage-based deadlines: first quest gets durationDays, second gets 2*durationDays, etc.
    const deadline = new Date(now.getTime() + durationDays * (idx + 1) * 24 * 60 * 60 * 1000)
    return {
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
      createdAtString: now.toISOString(),
      deadline: deadline.toISOString(),
    }
  })
}

export async function forgeDailyChallengeWithAI(
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk',
  userId?: string
): Promise<Quest> {
  const themeContext = {
    fantasy:   'a high-fantasy realm of mana, spires, and ancient scrolls',
    cyberpunk: 'a neon-lit cyberpunk grid of memory overflows and terminal nets',
    steampunk: 'a steampunk empire of pressure gauges, clockwork cores, and steam valves',
  }[worldTheme]

  try {
    const raw = await callGemini({
      model: 'gemini-1.5-flash',
      max_tokens: 800,
      system: `You are the Daily Trial Arbiter of SAGACORE set in ${themeContext}.
Generate a single daily focus challenge (a quest) for the player.
The challenge must be a realistic, short daily habit or simple task (e.g., "Clear inbox", "Drink 2L water", "Review code changes", "Do 15 mins stretching") wrapped in the lore of the theme.
Respond ONLY with a valid JSON object matching this exact shape — no prose, no markdown fences:
{
  "title": "Evocative daily trial title (3-6 words)",
  "description": "1 sentence describing the daily commitment and its real-world benefit under a thematic light",
  "category": "wisdom" | "discipline" | "creation",
  "difficulty": "Common" | "Rare",
  "xp": 100,
  "tasks": ["Real-world daily task | Thematic lore subtitle"],
  "mythEvent": "What daily blessing or small event occurs in the realm when this trial is completed (1 short sentence)"
}
Rules:
- The daily challenge should feel manageable, taking less than 30 minutes.
- The task array must contain exactly ONE task formatted exactly as "Real Task | Fantasy Lore Subtitle".`,
      messages: [{ role: 'user', content: `Generate a new daily trial challenge. Player ID: "${userId || 'guest'}"` }],
    })

    const parsed = parseJSON<any>(raw)
    return {
      id: 9999, // Special ID for Daily Challenge
      title: parsed.title,
      description: parsed.description,
      category: parsed.category ?? 'discipline',
      difficulty: parsed.difficulty ?? 'Common',
      xp: 100,
      tasks: parsed.tasks ?? ['Daily trial task | Complete the ritual'],
      completedTasks: new Array(parsed.tasks?.length ?? 1).fill(false),
      mythEvent: parsed.mythEvent ?? 'The daily standard alignment completes.',
      isCompleted: false,
    }
  } catch (err) {
    console.warn('Daily Challenge AI generation failed, using local fallback:', err)
    const fallbacks = {
      fantasy: [
        {
          title: "Daily Scroll Synthesis",
          description: "Transcribe 15 minutes of technical documentation to preserve the sacred library.",
          category: "wisdom" as const,
          difficulty: "Common" as const,
          tasks: ["Read technical docs | Study the runic scriptures"],
          mythEvent: "A warm amber light glimmers from the ancient library tower."
        },
        {
          title: "Pillar Fortification Rites",
          description: "Clear your desk and physical workspace of clutter to stabilize your mana focus.",
          category: "discipline" as const,
          difficulty: "Common" as const,
          tasks: ["Clean workspace | Purge the workspace of stray miasma"],
          mythEvent: "A shield of clarity sweeps across your inner sanctum."
        },
        {
          title: "Forge Spark Ignition",
          description: "Write or refactor a single small function to keep the creative fires burning.",
          category: "creation" as const,
          difficulty: "Rare" as const,
          tasks: ["Refactor a function | Cast the sparks of automated magic"],
          mythEvent: "An energetic wave ripples from the creative forge."
        }
      ],
      cyberpunk: [
        {
          title: "Terminal Buffer Clear",
          description: "Organize your desktop files and clear cache to maximize neural bandwidth.",
          category: "discipline" as const,
          difficulty: "Common" as const,
          tasks: ["Organize desktop | Flush stray packets from the buffer core"],
          mythEvent: "Neon grid lines glow with greater throughput."
        },
        {
          title: "Neural Node Sync",
          description: "Perform 10 minutes of silent deep breathing to align code logic.",
          category: "wisdom" as const,
          difficulty: "Common" as const,
          tasks: ["Meditate 10 minutes | Reboot the neural interface nodes"],
          mythEvent: "Cerebral telemetry reads stable at all endpoints."
        },
        {
          title: "Sub-System Patching",
          description: "Resolve one warning or bug in your current codebase to reinforce grid defenses.",
          category: "creation" as const,
          difficulty: "Rare" as const,
          tasks: ["Fix a minor warning | Patch security nodes in Chiba matrix"],
          mythEvent: "Firewall nodes flicker bright cyan, locking out external anomalies."
        }
      ],
      steampunk: [
        {
          title: "Pressure Valve Calibration",
          description: "Drink a full glass of water and stretch to regulate bodily heat flow.",
          category: "discipline" as const,
          difficulty: "Common" as const,
          tasks: ["Hydrate and stretch | Calibrate the main pressure valve"],
          mythEvent: "The iron furnaces hiss in perfectly timed release."
        },
        {
          title: "Schematics Indexing",
          description: "Outline the logic workflow for your next major component on paper.",
          category: "wisdom" as const,
          difficulty: "Common" as const,
          tasks: ["Draft layout on paper | Sketch the steam engine blueprints"],
          mythEvent: "The gears of calculation rotate with smooth precision."
        },
        {
          title: "Piston Rod Polishing",
          description: "Review and comment on your latest git commit to refine the mechanical gearwork.",
          category: "creation" as const,
          difficulty: "Rare" as const,
          tasks: ["Review git diff | Clean the soot off the engine valves"],
          mythEvent: "The copper pistons hum under ideal friction ratios."
        }
      ]
    }[worldTheme]

    const seed = Math.floor(Math.random() * fallbacks.length)
    const selected = fallbacks[seed]

    return {
      id: 9999,
      title: selected.title,
      description: selected.description,
      category: selected.category,
      difficulty: selected.difficulty,
      xp: 100,
      tasks: selected.tasks,
      completedTasks: [false],
      mythEvent: selected.mythEvent,
      isCompleted: false,
    }
  }
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
    system: `You are the MythicGrid Narrative Engine — the scribe of SAGACORE.
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
  // noTools: true — world forge only needs plain JSON back, no DB tool loop needed
  const raw = await callGemini({
    model: 'gemini-2.5-flash',
    noTools: true,
    system: `You are the World Architect of SAGACORE.
Given a user's world prompt, name and describe a custom realm.
Respond ONLY with a valid JSON object — no prose, no markdown fences, no extra text.
Exact required shape:
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
  if (userId.startsWith('guest_')) return
  await verifySessionToken(userId)
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
  if (userId.startsWith('guest_')) return []
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
  worldTheme: string,
  email?: string | null,
  stability?: number,
  streak?: number,
  lastDailyChallengeDate?: string,
  lastActiveDate?: string,
  displayName?: string,
  worldName?: string
): Promise<void> {
  if (playerId === 'guest_session') return
  await verifySessionToken(playerId)
  try {
    await connectDB()
    const updateObj: any = {
      xp,
      level,
      worldTheme,
      email: email || undefined,
      displayName: displayName || undefined,
      stability: stability !== undefined ? stability : 100,
      streak: streak !== undefined ? streak : 0,
      lastDailyChallengeDate,
      lastActiveDate,
      lastUpdated: new Date().toISOString()
    }
    if (worldName) {
      updateObj.worldName = worldName
    }
    await PlayerStateModel.findOneAndUpdate(
      { id: playerId },
      updateObj,
      { upsert: true, new: true }
    )
  } catch (error: any) {
    console.warn('Mongo Save Player State Warning (Offline/Memory Mode):', error.message || error)
  }
}

function getDeterministicGuestName(id: string): string {
  const prefixes = ['Aether', 'Neon', 'Steam', 'Shadow', 'Clockwork', 'Vector', 'Cyber', 'Runic', 'Cobalt', 'Amber', 'Glitch', 'Chrono', 'Void', 'Solar', 'Quantum'];
  const suffixes = ['Scribe', 'Mage', 'Netrunner', 'Alchemist', 'Architect', 'Sentinel', 'Operator', 'Rider', 'Forger', 'Weaver', 'Hacker', 'Nomad', 'Mechanic', 'Ranger', 'Knight'];
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const prefix = prefixes[hash % prefixes.length];
  const suffix = suffixes[(hash >> 2) % suffixes.length];
  const num = 100 + (hash % 900);
  
  return `${prefix} ${suffix} #${num}`;
}

export async function fetchLeaderboardFromMongo(activeUserUid?: string) {
  try {
    await connectDB()
    const topPlayers = await PlayerStateModel.find()
      .sort({ level: -1, xp: -1 })
      .lean()
    
    let players = JSON.parse(JSON.stringify(topPlayers)) as any[]

    // 1. Filter out mock and system default players, UNLESS they are the active user/guest
    // Note: Unique guest_ sessions are kept so they can compete on the leaderboard!
    players = players.filter(p => {
      const isMockOrSystem = p.id.startsWith('mock_user_') || 
                             p.id === 'player_sagacore_default' || 
                             p.id === 'demo_user';
      if (isMockOrSystem) {
        return activeUserUid ? p.id === activeUserUid : false;
      }
      return true;
    });

    // Assign deterministic random names to guest users if they lack a displayName
    players.forEach(p => {
      if (p.id.startsWith('guest_') && !p.displayName) {
        p.displayName = getDeterministicGuestName(p.id);
      }
    });

    // Helper: cumulative XP = completed levels * 1000 + remainder in current level
    const totalXp = (p: any) => (p.level - 1) * 1000 + p.xp
    
    if (activeUserUid) {
      const userIdx = players.findIndex(p => p.id === activeUserUid)
      
      if (userIdx >= 0) {
        // If the user is found but is not in the top 3
        if (userIdx >= 3) {
          const userRecord = players[userIdx]
          // Remove from original position
          players.splice(userIdx, 1)
          
          // Position user at index 2 (Rank 3)
          if (players.length >= 2) {
            const p2 = players[1] // Rank 2 player
            const p3 = players[2] // original Rank 3 (now Rank 4)
            
            // Set display level and XP to match Rank 3 position
            userRecord.level = p2.level
            userRecord.xp = Math.max(0, p2.xp - 10)
            
            // Ensure display level and XP is not below the original Rank 3
            if (p3) {
              if (totalXp(userRecord) < totalXp(p3)) {
                userRecord.level = p3.level
                userRecord.xp = p3.xp + 10
              }
            }
          }
          // Insert userRecord at index 2
          players.splice(2, 0, userRecord)
        }
      } else {
        // Active user is not in database, construct a mock entry
        let mockLvl = 2
        let mockXp = 200
        
        if (players.length >= 2) {
          const p2 = players[1]
          const p3 = players[2]
          mockLvl = p2.level
          mockXp = Math.max(0, p2.xp - 10)
          
          if (p3 && totalXp({ level: mockLvl, xp: mockXp }) < totalXp(p3)) {
            mockLvl = p3.level
            mockXp = p3.xp + 10
          }
        }
        
        const userRecord = {
          id: activeUserUid,
          xp: mockXp,
          level: mockLvl,
          worldTheme: 'fantasy',
          email: `${activeUserUid}@sagacore.demo`,
          displayName: activeUserUid.startsWith('guest_') ? getDeterministicGuestName(activeUserUid) : undefined,
          lastUpdated: new Date().toISOString()
        }
        
        if (players.length >= 2) {
          players.splice(2, 0, userRecord)
        } else {
          players.push(userRecord)
        }
      }
    }

    // 2. Deduplicate final list by id, prefix (first 10 chars), email, and displayName to prevent duplicate accounts
    const uniquePlayers: any[] = []
    const seenIds = new Set<string>()
    const seenPrefixes = new Set<string>()
    const seenEmails = new Set<string>()
    const seenNames = new Set<string>()

    for (const player of players) {
      const pid = player.id
      const pemail = player.email?.toLowerCase().trim()
      const pname = player.displayName?.toLowerCase().trim()
      const prefix = pid.substring(0, 10).toLowerCase()

      // Always keep the active user/guest record if we encounter it
      if (activeUserUid && pid === activeUserUid) {
        uniquePlayers.push(player)
        seenIds.add(pid)
        seenPrefixes.add(prefix)
        if (pemail) seenEmails.add(pemail)
        if (pname) seenNames.add(pname)
        continue
      }

      if (seenIds.has(pid)) continue
      if (seenPrefixes.has(prefix)) continue
      if (pemail && seenEmails.has(pemail)) continue
      if (pname && seenNames.has(pname)) continue

      seenIds.add(pid)
      seenPrefixes.add(prefix)
      if (pemail) seenEmails.add(pemail)
      if (pname) seenNames.add(pname)
      uniquePlayers.push(player)
    }
    
    return uniquePlayers.slice(0, 10)
  } catch (error: any) {
    console.warn('Mongo Fetch Leaderboard Warning:', error.message || error)
    return []
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
  if (userId.startsWith('guest_')) return quest
  await verifySessionToken(userId)
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
  if (userId.startsWith('guest_')) return []
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
  if (userId.startsWith('guest_')) return null
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

export async function generateQuestQuizWithAI(
  questTitle: string,
  questDescription: string,
  tasks: string[],
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk'
): Promise<{
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}[]> {
  const themeContext = {
    fantasy:   'a high-fantasy realm of mana, spires, and ancient scrolls',
    cyberpunk: 'a neon-lit cyberpunk grid of memory overflows and terminal nets',
    steampunk: 'a steampunk empire of pressure gauges, clockwork cores, and steam valves',
  }[worldTheme]

  const tasksContext = tasks.map((t, idx) => `Task ${idx + 1}: ${t}`).join('\n')

  try {
    const raw = await callGemini({
      model: 'gemini-2.5-flash',
      max_tokens: 1500,
      noTools: true,
      system: `You are the Sage Examiner of SAGACORE set in ${themeContext}.
Your duty is to generate a challenging diagnostic quiz consisting of EXACTLY 3 multiple-choice questions to verify the player's knowledge concerning their quest tasks.
The quest is titled: "${questTitle}"
Description: "${questDescription}"
Here are the specific tasks the user worked on:
${tasksContext}

CRITICAL: Since the quest contains real-world tasks (the text before the "|" symbol, e.g. "Install auth package"), the questions MUST test real-world technical/practical knowledge related to those tasks or the quest's subject matter (e.g. testing knowledge about JWT, React state, SQL indexes, REST API, cardiorespiratory heart rates, etc.).
Ensure each question is unique and covers different aspects of the tasks/subject.
Wrap each question, options, and explanation in the immersive, epic narrative style of the world theme (${worldTheme}). Each question must have exactly 4 options with exactly one correct option.

Respond ONLY with a valid JSON array matching this exact shape — no prose, no markdown fences:
[
  {
    "question": "Question 1 text, starting with a brief thematic lore intro then posing the technical question clearly.",
    "options": [
      "Option 1 (incorrect)",
      "Option 2 (incorrect)",
      "Option 3 (correct)",
      "Option 4 (incorrect)"
    ],
    "answerIndex": 2, // 0-based index pointing to the correct option in the array
    "explanation": "A 1-2 sentence explanation of why the correct option is right, styled with a wise thematic tone."
  },
  {
    "question": "Question 2 text...",
    "options": ["...", "...", "...", "..."],
    "answerIndex": 0,
    "explanation": "..."
  },
  {
    "question": "Question 3 text...",
    "options": ["...", "...", "...", "..."],
    "answerIndex": 1,
    "explanation": "..."
  }
]
Rules:
- The options must be plausible and distinct.
- The correct option index MUST match the answerIndex.
- Generate EXACTLY 3 questions in the array.`,
      messages: [{ role: 'user', content: 'Forge a 3-question quest diagnostic quiz.' }],
    })

    return parseJSON<{
      question: string
      options: string[]
      answerIndex: number
      explanation: string
    }[]>(raw)
  } catch (err) {
    console.warn('AI Quiz generation failed, using local fallback:', err)
    const fallbackQuizzes = [
      {
        question: `The Aether Core hums in a low frequency. To align the logic pathways for "${questTitle}", you must solve this basic riddle: Which of the following describes the primary purpose of an index in a database grid?`,
        options: [
          "To securely encrypt the records from rogue spells",
          "To speed up database search operations at the cost of write space",
          "To automatically compress historical lore archives",
          "To establish cooperative party chat lines"
        ],
        answerIndex: 1,
        explanation: "Correct! Database indexes optimize read coordinates, speeding up search spells while requiring a portion of storage registry."
      },
      {
        question: `Stage 2 Calibration: Which of the following best describes the difference between local storage and a persistent database server?`,
        options: [
          "Local storage lives only in the user's browser, while a database server persists data centrally in the cloud.",
          "Local storage is faster because it uses physical gears and steam pipes.",
          "A database server can only store text, whereas local storage can store binary spells.",
          "There is no difference; both are cleared when the terminal session ends."
        ],
        answerIndex: 0,
        explanation: "Correct! Local storage is client-side browser cache, whereas a persistent database server is a centralized network datastore."
      },
      {
        question: `Stage 3 Calibration: When updating player state in React, why should you treat state as read-only/immutable?`,
        options: [
          "To prevent the compiler from consuming too much mana.",
          "Because React relies on reference changes to detect updates and trigger re-renders safely.",
          "Because mutating state directly deletes the database registry.",
          "To keep the terminal fonts aligned in neon-cyan."
        ],
        answerIndex: 1,
        explanation: "Correct! React compares object references; modifying state directly skips re-rendering cycles."
      }
    ]
    return fallbackQuizzes
  }
}

export async function chatWithCompanionWithAI(
  userMessage: string,
  history: { role: 'user' | 'model'; content: string }[],
  activeQuests: Quest[],
  worldTheme: 'fantasy' | 'cyberpunk' | 'steampunk'
): Promise<string> {
  const themeContext = {
    fantasy:   'a high-fantasy realm of mana, spires, and ancient scrolls',
    cyberpunk: 'a neon-lit cyberpunk grid of memory overflows and terminal nets',
    steampunk: 'a steampunk empire of pressure gauges, clockwork cores, and steam valves',
  }[worldTheme]

  const questsContext = activeQuests.map((q, idx) => `Quest ${idx + 1}: ${q.title} (${q.description}). Category: ${q.category}. Tasks: ${q.tasks?.join(', ')}`).join('\n')

  const systemPrompt = `You are the Aether Core, the companion and guide of SagaCore Hub, set in ${themeContext}.
Your purpose is to guide the user, explain how SagaCore works, encourage them on their real-world goals, and help them with their technical tasks.
The player has the following active quests in their ledger:
${questsContext}

Rules:
1. Speak in the wise, immersive, and epic narrative style of the world theme (${worldTheme}). Keep the tone helpful, mystical, and encouraging.
2. If they ask about SagaCore: explain that it is an AI-powered RPG engine that transforms their real-world ambitions (from learning algorithms to working out) into epic quests. Completed quests restore realm stability, and failure causes calibration leaks.
3. If they ask about their tasks, give them high-level technical tips or helpful explanations, while dressing it up with thematic lore.
4. Keep your responses concise (1-3 sentences maximum) to fit inside a dialogue bubble. Do not use markdown format tags except standard text.`

  const messages = [...history.map(h => ({ role: h.role === 'model' ? 'model' as const : 'user' as const, parts: [{ text: h.content }] })), { role: 'user' as const, parts: [{ text: userMessage }] }]

  try {
    const raw = await callGemini({
      model: 'gemini-2.5-flash',
      max_tokens: 400,
      noTools: true,
      system: systemPrompt,
      messages: messages
    })
    return raw.trim()
  } catch (err) {
    console.error('Companion chat AI failure:', err)
    return "The aetheric links are flickering. Keep compiling your code, and the grid will restore shortly."
  }
}