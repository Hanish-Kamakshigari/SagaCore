// demo-forge.js — Real-Time Dream Forge AI Terminal Demonstration
const fs = require('fs');
const path = require('path');

// Colors
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const PURPLE = "\x1b[35m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const GRAY = "\x1b[90m";

console.log(`${BOLD}${PURPLE}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}         [SYSTEM] SAGACORE DREAM FORGE ENGINE       ${RESET}`);
console.log(`${BOLD}${PURPLE}====================================================${RESET}`);

// 1. Parse .env file manually
const envPath = path.join(__dirname, '.env');
let GOOGLE_API_KEY = "";
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GOOGLE_API_KEY=(.+)/);
  if (match && match[1]) {
    GOOGLE_API_KEY = match[1].trim();
  }
}

if (!GOOGLE_API_KEY) {
  console.log(`${RED}[ERROR] Error: GOOGLE_API_KEY not found in .env file!${RESET}`);
  process.exit(1);
}

// 2. Parse arguments or set defaults
const ambition = process.argv[2] || "Build a real-time multiplayer roguelike game";
const level = parseInt(process.argv[3], 10) || 15;

console.log(`${GRAY}[SYSTEM] Hydrated environment coordinates...${RESET}`);
console.log(`${BOLD}[PLAYER] Level:${RESET} ${YELLOW}${level} (Master Creator)${RESET}`);
console.log(`${BOLD}[AMBITION] "${ambition}"${RESET}`);
console.log("");

async function forgeDemo() {
  console.log(`${CYAN}[INFO] [1/3] Directing focus to the Aether grid...${RESET}`);
  
  const themeContext = "a high-fantasy realm of mana, spires, and ancient scrolls";
  const systemPrompt = `You are the Campaign Architect of SAGACORE set in ${themeContext}.
Given a user's master goal or ambition, decompose it into a legendary campaign consisting of EXACTLY 3 sequential, highly relevant quests.
Quest 1 should focus on learning/prep (wisdom category).
Quest 2 should focus on crafting/building (creation category).
Quest 3 should focus on testing/polishing/discipline (discipline category).

The user is currently Level ${level} in their SAGACORE journey. 
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
      "tasks": ["practical real-world step 1 | lore subtitle", "practical real-world step 2 | lore subtitle", "practical real-world step 3 | lore subtitle"],
      "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
    },
    {
      "title": "Quest title (4-7 words) highly specific to the actual goal and building stage",
      "description": "1-2 sentences in thematic language detailing the specific real-world goal and building step",
      "category": "creation",
      "difficulty": "Common" | "Rare" | "Epic" | "Legendary",
      "xp": number matching the level scaling rules above,
      "tasks": ["practical real-world step 1 | lore subtitle", "practical real-world step 2 | lore subtitle", "practical real-world step 3 | lore subtitle"],
      "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
    },
    {
      "title": "Quest title (4-7 words) highly specific to the actual goal and testing stage",
      "description": "1-2 sentences in thematic language detailing the specific real-world goal and testing step",
      "category": "discipline",
      "difficulty": "Common" | "Rare" | "Epic" | "Legendary",
      "xp": number matching the level scaling rules above,
      "tasks": ["practical real-world step 1 | lore subtitle", "practical real-world step 2 | lore subtitle", "practical real-world step 3 | lore subtitle"],
      "mythEvent": "What changes in the world when this quest is completed (1 vivid sentence)"
    }
  ]
}`;

  console.log(`${CYAN}[INFO] [2/3] Summoning Gemini API at hyper-speed...${RESET}`);
  const startTime = Date.now();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `Master Ambition: "${ambition}"` }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(JSON.stringify(err));
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`${GREEN}[SUCCESS] [3/3] Questline successfully forged in ${duration}s!${RESET}`);
    console.log("");

    const campaign = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    campaign.quests.forEach((q, idx) => {
      const catMarker = q.category === 'wisdom' ? '[WISDOM]' : q.category === 'creation' ? '[CREATION]' : '[DISCIPLINE]';
      const diffColor = q.difficulty === 'Legendary' ? YELLOW : q.difficulty === 'Epic' ? PURPLE : CYAN;
      
      console.log(`${BOLD}${diffColor}[QUEST ${idx + 1}: ${q.difficulty.toUpperCase()}] ${q.title}${RESET}`);
      console.log(`${GRAY}${q.description}${RESET}`);
      console.log(`${BOLD}XP reward:${RESET} ${GREEN}+${q.xp} XP${RESET}`);
      console.log(`${BOLD}Actionable Roadmap:${RESET}`);
      q.tasks.forEach(t => {
        console.log(`  - [ ] ${t}`);
      });
      console.log(`${ITALIC_GRAY}“${q.mythEvent}”${RESET}`);
      console.log("-".repeat(50));
    });

  } catch (error) {
    console.log(`${RED}[ERROR] Error during forge: ${error.message}${RESET}`);
  }
}

const ITALIC_GRAY = "\x1b[3m\x1b[90m";

forgeDemo();
