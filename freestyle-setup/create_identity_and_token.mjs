import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPaths = [path.join(__dirname,".env"), path.join(__dirname,"..",".env")];
for (const p of envPaths) if (fs.existsSync(p)) { (await import("dotenv")).config({ path: p }); break; }

const REPO_ID = process.argv[2];
if (!REPO_ID) { console.error("Usage: node create_identity_and_token.mjs <REPO_ID>"); process.exit(1); }
if (!process.env.FREESTYLE_API_KEY) { console.error("❌ FREESTYLE_API_KEY missing."); process.exit(1); }

import { FreestyleSandboxes } from "freestyle-sandboxes";
const sandboxes = new FreestyleSandboxes({ apiKey: process.env.FREESTYLE_API_KEY });

const identity = await sandboxes.createGitIdentity();
const token = await sandboxes.createGitToken({ identityId: identity.id });
await sandboxes.grantPermission({ identityId: identity.id, repoId: REPO_ID, permission: "write" });

console.log("✅ IDENTITY_ID =", identity.id);
console.log("✅ TOKEN       =", token.value);
