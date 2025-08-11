import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const CONFIG_DIR = path.join(os.homedir(), '.canvas-cli');
const TOKEN_FILE = path.join(CONFIG_DIR, 'credentials.json');
const ENCRYPTION_KEY = 'canvas-cli-secure-key-2024';

async function ensureConfigDir() {
  try {
    await fs.access(CONFIG_DIR);
  } catch {
    await fs.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(text) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

export async function storeToken(token, domain) {
  await ensureConfigDir();
  
  const credentials = {
    token: encrypt(token),
    domain: domain,
    savedAt: new Date().toISOString()
  };
  
  await fs.writeFile(TOKEN_FILE, JSON.stringify(credentials, null, 2), {
    mode: 0o600
  });
}

export async function getStoredToken() {
  try {
    await fs.access(TOKEN_FILE);
    const data = await fs.readFile(TOKEN_FILE, 'utf8');
    const credentials = JSON.parse(data);
    
    const decryptedToken = decrypt(credentials.token);
    if (!decryptedToken) {
      return null;
    }
    
    return {
      token: decryptedToken,
      domain: credentials.domain,
      savedAt: credentials.savedAt
    };
  } catch {
    return null;
  }
}

export async function clearToken() {
  try {
    await fs.unlink(TOKEN_FILE);
  } catch {
    // File doesn't exist, that's okay
  }
}

export async function hasStoredToken() {
  try {
    await fs.access(TOKEN_FILE);
    return true;
  } catch {
    return false;
  }
}