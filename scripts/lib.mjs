import { spawn, spawnSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const backend = join(root, "backend");
export const frontend = join(root, "frontend");
const win = process.platform === "win32";
export const venvPython = join(backend, ".venv", win ? "Scripts" : "bin", win ? "python.exe" : "python");
export const npm = win ? "npm.cmd" : "npm";

export function run(cmd, args, cwd, label) {
  console.log(`\n> [${label}] ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: win && cmd.endsWith(".cmd") });
  if (r.status !== 0) {
    console.error(`\n[${label}] failed (exit ${r.status ?? r.error?.message}).`);
    process.exit(r.status || 1);
  }
}

export function copyEnv(dir) {
  const from = join(dir, ".env.example");
  const to = join(dir, dir === frontend ? ".env.local" : ".env");
  if (existsSync(from) && !existsSync(to)) { copyFileSync(from, to); console.log(`created ${to}`); }
}

export function pythonCmd() {
  for (const c of win ? ["python", "py"] : ["python3", "python"]) {
    if (spawnSync(c, ["--version"], { stdio: "ignore" }).status === 0) return c;
  }
  console.error("Python 3.10+ was not found. Install it from python.org and re-run `npm run setup`.");
  process.exit(1);
}

export { spawn, existsSync };
