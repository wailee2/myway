import { backend, frontend, venvPython, npm, run } from "./lib.mjs";

run(venvPython, ["-m", "pytest", "-q"], backend, "backend tests");
run(npm, ["run", "typecheck"], frontend, "frontend typecheck");
