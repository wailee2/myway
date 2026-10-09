import { backend, frontend, venvPython, npm, spawn, existsSync } from "./lib.mjs";

if (!existsSync(venvPython) || !existsSync(`${frontend}/node_modules`)) {
  console.error("Dependencies are not installed yet. Run `npm run setup` first.");
  process.exit(1);
}

const win = process.platform === "win32";
const procs = [
  ["api", "\x1b[36m", venvPython, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"], backend],
  ["web", "\x1b[35m", npm, ["run", "dev"], frontend],
].map(([name, color, cmd, args, cwd]) => {
  const p = spawn(cmd, args, { cwd, shell: win && cmd.endsWith(".cmd"), env: { ...process.env, FORCE_COLOR: "1" } });
  const tag = `${color}[${name}]\x1b[0m `;
  const pipe = (s, out) => s.on("data", (d) => d.toString().split(/\r?\n/).filter(Boolean).forEach((l) => out.write(tag + l + "\n")));
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stdout);
  p.on("exit", (code) => { console.log(`${tag}exited (${code}).`); stop(); });
  return p;
});

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const p of procs) { try { win ? spawn("taskkill", ["/pid", String(p.pid), "/T", "/F"]) : p.kill("SIGTERM"); } catch {} }
  setTimeout(() => process.exit(0), 500);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.log("\nFrontend  http://localhost:3000\nAPI       http://localhost:8000  (docs: /docs)\nCtrl+C stops both.\n");
