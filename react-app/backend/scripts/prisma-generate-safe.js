/**
 * Gera o Prisma Client sem falhar quando o engine está bloqueado (EPERM no Windows).
 * Uso: node scripts/prisma-generate-safe.js
 * Force: PRISMA_FORCE_GENERATE=1 node scripts/prisma-generate-safe.js
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const clientIndex = path.join(rootDir, "node_modules", ".prisma", "client", "index.js");

function runGenerate() {
  return spawnSync("npx", ["prisma", "generate"], {
    cwd: rootDir,
    encoding: "utf8",
    shell: true,
  });
}

if (fs.existsSync(clientIndex) && process.env.PRISMA_FORCE_GENERATE !== "1") {
  process.exit(0);
}

const result = runGenerate();
const output = `${result.stdout || ""}${result.stderr || ""}`;

if (result.status === 0) {
  process.exit(0);
}

if (/EPERM|operation not permitted/i.test(output)) {
  console.warn("\n⚠️  Prisma generate ignorado: query engine em uso (npm run dev ativo?).");
  console.warn("   Pare o servidor com Ctrl+C e execute: npm run prisma:generate\n");
  process.exit(0);
}

if (output.trim()) {
  console.error(output);
}
process.exit(result.status || 1);
