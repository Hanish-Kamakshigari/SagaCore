# SAGACORE
### *Forge your ambitions. Shape your realm. Become the legend.*

> An autonomous AI agent that transforms real-world goals into living, evolving quest campaigns — powered by Gemini and persisted through MongoDB.

---

## What It Does

SAGACORE is an **AI-powered gamified productivity platform** that transforms real-world goals into immersive fantasy questlines. Instead of traditional to-do lists, users embark on dynamic adventures where goals become quests, accomplishments shape evolving realms, and progress is immortalized within a living codex.

You type a real-world ambition ("master graph traversal algorithms", "complete a 5K run", "build a RAG pipeline") and an autonomous AI agent:

1. **Reads your current player state** from MongoDB to understand your level, active quests, and progress
2. **Plans a 3-quest sequential campaign** — one Wisdom quest, one Creation quest, one Discipline quest — each building on the last
3. **Writes all three quests directly to the database** using Gemini Function Calling
4. **Locks later quests** until earlier ones are complete, enforcing a real progression arc
5. **Narrates your achievements** as evolving lore chapters in the Codex when quests are completed

This is not a chatbot. The agent uses tools to act on a live database — it reads state, reasons about it, and writes structured results back.

---

### ✅ Move Beyond Chat
The agent does not answer questions. It uses **Gemini Function Calling** to invoke database tools directly:

| Tool | What It Does |
|---|---|
| `getRealmState` | Reads player XP, level, and active quests before reasoning |
| `saveQuestToDatabase` | Writes a fully structured quest to MongoDB |
| `saveChapterToDatabase` | Inscribes a lore chronicle on quest completion |
| `completeQuest` | Marks a quest complete and updates player state |

Gemini decides **when and which tools to call** — the app does not parse JSON and save manually.

### ✅ Multi-Step Mission
The `forgeQuestlineWithAI` function triggers a **ReAct agentic loop** (max 5 iterations):

```
User submits ambition
  → Agent calls getRealmState        (reads DB)
  → Agent reasons about player level + existing quests
  → Agent calls saveQuestToDatabase  (Quest 1: Wisdom)
  → Agent calls saveQuestToDatabase  (Quest 2: Creation, depends on Quest 1)
  → Agent calls saveQuestToDatabase  (Quest 3: Discipline, depends on Quest 2)
  → Agent returns campaign summary
```

### ✅ Partner MCP Integration
SAGACORE integrates **MongoDB Atlas** as its partner MCP tool layer. The Gemini agent uses MongoDB as its persistent memory — reading world state before planning, and writing structured quest data autonomously. All player progress, quest campaigns, and lore chapters are persisted per-user in MongoDB with full multi-user isolation via Firebase UID scoping.

### ✅ Powered by Gemini
All AI reasoning runs on **Gemini 2.5 Flash** with automatic fallback to **Gemini 2.5 Pro** on quota pressure. Three distinct AI engines:

- **DreamForge Engine** — transforms ambitions into quest campaigns via Function Calling
- **MythOS Narrative Engine** — generates lore chronicles on quest completion
- **World Architect** — creates custom realm descriptions from user prompts

---

## Features

### DreamForge Engine
Transforms user goals into personalized quest campaigns.
- AI-generated questlines via Gemini Function Calling
- Dynamic quest difficulty scaling based on player level
- Goal decomposition into actionable dual-layer tasks (real task | fantasy lore subtitle)
- Multi-stage sequential campaign progression with dependency locking

### MythOS Narrative Engine
Creates evolving lore based on player actions.
- Procedural lore generation on every quest completion
- Dynamic codex chapters unique to each achievement
- Quest failure narration with dark world consequences
- Persistent world storytelling that accumulates over time

### World Architect
Choose or forge unique realms.
- Fantasy — Sanctum of Aetheria
- Cyberpunk — Neo-Chiba Grid 9
- Steampunk — Aeronaut Iron Keep
- Custom AI-generated worlds from any prompt

### Progression System
- XP & leveling with animated bar glow on every gain
- 20-tier rank system: Neophyte Scribe → Grand Sage Paragon
- Quest completion tracking with Chronicled state
- Realm Stability System tied to quest category performance
- Celestial Ascension modal on level-up

### Memory Engine
- MongoDB-backed persistence with Mongoose ORM
- Quest history and roadmap task tracking
- Lore archive storage in Evolving Codex
- Player state management (XP, level, world theme)
- Full multi-user isolation via Firebase UID scoping
- localStorage cache layer for instant UI hydration

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                   │
│  Hero · Dashboard · Auth · QuestCard · XPBar · Codex │
└────────────────────┬────────────────────────────────┘
                     │ Server Actions ('use server')
┌────────────────────▼────────────────────────────────┐
│              ai.ts — Agentic Engine Layer            │
│                                                      │
│  callGemini() — ReAct loop (max 5 iterations)        │
│    ├── Gemini 2.5 Flash (primary)                    │
│    ├── Gemini 2.5 Pro  (fallback on 429/503)         │
│    └── Function Calling: AUTO mode                   │
│                                                      │
│  forgeQuestlineWithAI()  → 3-quest campaign          │
│  generateAdaptiveChapter() → lore narration          │
│  forgeCustomWorldWithAI()  → realm generation        │
│  generateRoadmapForQuest() → task breakdown          │
└──────────┬──────────────────────┬───────────────────┘
           │ Tool Execution       │ Direct Calls
┌──────────▼──────────┐  ┌───────▼───────────────────┐
│   tools.ts          │  │   mongodb.ts               │
│                     │  │                            │
│ getRealmState()     │  │ QuestModel                 │
│ saveQuest()         │  │ LoreChapterModel           │
│ completeQuest()     │  │ PlayerStateModel           │
└──────────┬──────────┘  └───────┬───────────────────┘
           └──────────┬──────────┘
              ┌───────▼────────┐
              │  MongoDB Atlas │
              │  (Partner MCP) │
              └────────────────┘
```

---

## Tech Stack

### Frontend
- Next.js 15, React, TypeScript
- Tailwind CSS, Framer Motion
- Lucide React, Glassmorphism Design
- Cinzel (fantasy display) + Inter (body)

### Backend
- Next.js Server Actions (`'use server'`)
- Mongoose ORM, MongoDB Atlas

### AI
- Google Gemini 2.5 Flash (primary) / Gemini 2.5 Pro (fallback)
- Gemini Function Calling API — agent orchestration
- AUTO tool-calling mode with ReAct loop (max 5 iterations)
- Exponential backoff retry (1s → 2s → 4s)

### Auth & Deployment
- Firebase Authentication
- Vercel

---


## Why This Is Agentic

The distinction between a standard LLM app and an agent:

| Standard App | SAGACORE Agent |
|---|---|
| Prompt → JSON text → app saves to DB | Prompt → agent reads DB → reasons → agent writes to DB |
| Single-turn | Multi-turn ReAct loop (up to 5 iterations) |
| App controls all state | Agent autonomously decides what to read/write |
| One output | Chained tool calls with intermediate results fed back |

---

## Future Roadmap

- Multiplayer Realms & Guild System
- AI Companions with persistent memory
- Achievement Badges & Streak tracking
- Voice Narration for lore chapters
- Real Task Verification (GitHub commits, LeetCode solves)
- GitHub Integration & LeetCode Progress Tracking
- Calendar Synchronization
- Mobile Application

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Hanish Kamakshigari
