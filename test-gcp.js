// test-gcp.js — Validate GCP Service Account Integration Natively
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Formatting Colors
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";

console.log(`${BOLD}${CYAN}====================================================${RESET}`);
console.log(`${BOLD}${CYAN}      🛡️  SAGACORE GCP AUTHENTICATION CHECK  🛡️      ${RESET}`);
console.log(`${BOLD}${CYAN}====================================================${RESET}`);

// 1. Read .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log(`${RED}❌ Error: .env file not found at ${envPath}!${RESET}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

function getEnvVar(name) {
  const match = envContent.match(new RegExp(`${name}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
  return match ? match[1].trim() : '';
}

const email = getEnvVar('GCP_CLIENT_EMAIL');
let privateKey = getEnvVar('GCP_PRIVATE_KEY');

// Handle escaped newlines in env file
privateKey = privateKey.replace(/\\n/g, '\n');

console.log(`${GRAY}[SYSTEM] Loaded credentials from .env...${RESET}`);
console.log(`${BOLD}[SERVICE ACCOUNT EMAIL]${RESET} ${email ? GREEN + email : RED + 'Not configured'}${RESET}`);
console.log(`${BOLD}[PRIVATE KEY STATE]${RESET} ${privateKey ? GREEN + 'Detected (' + privateKey.substring(0, 40) + '...)' : RED + 'Not configured'}${RESET}`);

if (!email || !privateKey) {
  console.log(`\n${RED}❌ Connection Aborted: Please check your .env configuration fields!${RESET}`);
  process.exit(1);
}

async function verifyAuth() {
  console.log(`\n${CYAN}🔄 Initializing token exchange signature with Google Cloud OAuth server...${RESET}`);

  try {
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
    
    // RSA-SHA256 signature generation using Node.js crypto
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    
    const signature = sign.sign(privateKey, 'base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${signatureInput}.${signature}`;

    console.log(`${GRAY}[JWT] Encrypted token signature generated successfully.${RESET}`);
    console.log(`${CYAN}📡 Requesting Access Token exchange...${RESET}`);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Google OAuth API rejected the credentials:\n${JSON.stringify(err, null, 2)}`);
    }

    const data = await response.json();
    
    console.log(`\n${GREEN}✨ SUCCESS! Authentic token exchanged successfully. ✨${RESET}`);
    console.log(`${BOLD}[TOKEN TYPE]${RESET} Bearer`);
    console.log(`${BOLD}[EXPIRES IN]${RESET} ${data.expires_in} seconds`);
    console.log(`${BOLD}[ACCESS TOKEN]${RESET} ${data.access_token.substring(0, 30)}... (Safe and Verified)`);
    console.log(`\n${GREEN}🎉 Your Google Cloud Service Account is successfully linked and validated!${RESET}`);

  } catch (error) {
    console.log(`\n${RED}❌ Connection Failed!${RESET}`);
    console.log(`${YELLOW}Detail:${RESET} ${error.message}`);
    if (error.cause) {
      console.log(`${YELLOW}Cause:${RESET}`, error.cause);
    } else {
      console.log(`${YELLOW}Stack:${RESET}`, error.stack);
    }
    console.log(`\n${YELLOW}💡 Troubleshooting tips:${RESET}`);
    console.log(` 1. Check if the GCP_PRIVATE_KEY inside the .env has quotes around it.`);
    console.log(` 2. Ensure no extra backslashes were added to newlines.`);
    console.log(` 3. Make sure your system clock matches the current global time (since JWT uses timestamps).`);
  }
}

verifyAuth();
