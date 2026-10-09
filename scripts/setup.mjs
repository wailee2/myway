import { backend, frontend, venvPython, npm, run, copyEnv, pythonCmd, existsSync } from "./lib.mjs";

if (!existsSync(venvPython)) run(pythonCmd(), ["-m", "venv", ".venv"], backend, "backend");
run(venvPython, ["-m", "pip", "install", "-q", "-r", "requirements.txt"], backend, "backend");
run(npm, ["install", "--no-audit", "--no-fund"], frontend, "frontend");
copyEnv(backend);
copyEnv(frontend);
console.log("\nSetup done. Start both servers with: npm run dev");
