import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPaths = [path.join(__dirname,".env"), path.join(__dirname,"..",".env")];
for (const p of envPaths) if (fs.existsSync(p)) { (await import("dotenv")).config({ path: p }); break; }

if (!process.env.FREESTYLE_API_KEY) {
  console.error("❌ FREESTYLE_API_KEY missing.");
  process.exit(1);
}
import { FreestyleSandboxes } from "freestyle-sandboxes";
const sandboxes = new FreestyleSandboxes({ apiKey: process.env.FREESTYLE_API_KEY });
const res = await sandboxes.createGitRepository({ name: "my-existing-repo" });
console.log("✅ REPO_ID =", res.repoId);
