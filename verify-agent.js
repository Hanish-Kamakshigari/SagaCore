// verify-agent.js — End-to-End Google Cloud Agent Builder Verification
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";

console.log(`${BOLD}${CYAN}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}     [SYSTEM] SAGACORE AGENT BUILDER CHECK          ${RESET}`);
console.log(`${BOLD}${CYAN}====================================================${RESET}`);

// 1. Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log(`${RED}[ERROR] Error: .env file not found at ${envPath}!${RESET}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

function getEnvVar(name) {
  const match = envContent.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  return match ? match[1].trim() : '';
}

const email = getEnvVar('GCP_CLIENT_EMAIL');
let privateKey = getEnvVar('GCP_PRIVATE_KEY');
const gcpProject = getEnvVar('GCP_PROJECT_ID');
const gcpAgent = getEnvVar('GCP_AGENT_ID');
const gcpLocation = getEnvVar('GCP_LOCATION') || 'global';

// Handle escaped newlines in env file
privateKey = privateKey.replace(/\\n/g, '\n');

if (!email || !privateKey || !gcpProject || !gcpAgent) {
  console.log(`\n${RED}[ERROR] Connection Aborted: Please check your .env configuration fields!${RESET}`);
  console.log(`Ensure GCP_PROJECT_ID, GCP_AGENT_ID, GCP_CLIENT_EMAIL, and GCP_PRIVATE_KEY are defined.`);
  process.exit(1);
}

async function getGCPAuthToken() {
  const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const claimSet = JSON.stringify({
    iss: email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  });

  const base64UrlEncode = (str) => 
    Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signatureInput = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.json().catch(() => ({}));
    throw new Error(`OAuth failed: ${JSON.stringify(err)}`);
  }

  const data = await tokenResponse.json();
  return data.access_token;
}

async function verifyAgent() {
  try {
    console.log(`${GRAY}[SYSTEM] Generating secure JWT token...${RESET}`);
    const token = await getGCPAuthToken();
    console.log(`${GREEN}[SUCCESS] JWT authentication successful!${RESET}`);

    const sessionId = 'sagacore-verify-session-' + Date.now();
    const url = `https://${gcpLocation}-dialogflow.googleapis.com/v3/projects/${gcpProject}/locations/${gcpLocation}/agents/${gcpAgent}/sessions/${sessionId}:detectIntent`;

    const testQuery = 'Forge a quest campaign for: study Python loops';
    console.log(`\n${CYAN}[INFO] Sending verification query to Agent Builder...${RESET}`);
    console.log(`${BOLD}[QUERY]${RESET} "${testQuery}"`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        queryInput: {
          text: { text: testQuery },
          languageCode: 'en'
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Agent Builder API call failed: ${JSON.stringify(err, null, 2)}`);
    }

    const data = await response.json();
    const responseMessages = data.queryResult?.responseMessages || [];
    let agentText = '';

    for (const msg of responseMessages) {
      if (msg.text?.text?.[0]) {
        agentText += msg.text.text[0];
      }
    }

    console.log(`\n${CYAN}📥 Response received from Agent Builder:${RESET}`);
    console.log(`${GRAY}----------------------------------------${RESET}`);
    console.log(agentText ? agentText : JSON.stringify(data, null, 2));
    console.log(`${GRAY}----------------------------------------${RESET}`);

    // Validate JSON
    try {
      const clean = agentText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      console.log(`\n${GREEN}[SUCCESS] Response is valid, parseable JSON!${RESET}`);
      if (parsed.quests) {
        console.log(`${GREEN}[SUCCESS] Format matched Campaign Schema (contains ${parsed.quests.length} quests).${RESET}`);
      } else if (parsed.title && parsed.text) {
        console.log(`${GREEN}[SUCCESS] Format matched Lore Chapter Schema (contains title & text).${RESET}`);
      } else {
        console.log(`${YELLOW}[WARNING] JSON structure is valid but did not match expected SAGACORE schemas.${RESET}`);
      }
      console.log(`\n${GREEN}[SUCCESS] Verification completed successfully! Your Google Cloud Agent Builder is ready to run. ${RESET}`);
    } catch {
      console.log(`\n${RED}[WARNING] Response is NOT valid JSON!${RESET}`);
      console.log(`${YELLOW}Reason:${RESET} SAGACORE will trigger the fallback to local Gemini because the output was conversational.`);
      console.log(`\n${YELLOW}💡 Recommendation:${RESET} Make sure you saved your examples in the Playbook console.`);
    }

  } catch (error) {
    console.log(`\n${RED}[FAILED] Verification failed!${RESET}`);
    console.log(`${YELLOW}Detail:${RESET} ${error.message}`);
  }
}

verifyAgent();
