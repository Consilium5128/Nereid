import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { FreestyleSandboxes } from "freestyle-sandboxes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from this folder
dotenv.config({ path: path.join(__dirname, ".env") });

if (!process.env.FREESTYLE_API_KEY) {
  console.error("❌ FREESTYLE_API_KEY missing. Put it in freestyle-setup/.env as FREESTYLE_API_KEY=...");
  process.exit(1);
}

(async () => {
  try {
    const api = new FreestyleSandboxes({ apiKey: process.env.FREESTYLE_API_KEY });
    const repos = await api.listGitRepositories();
    console.log("✅ Connected. Repositories:");
    console.log(JSON.stringify(repos, null, 2));
  } catch (err) {
    console.error("❌ API call failed:");
    console.error(err?.response?.data || err);
    process.exit(1);
  }
})();