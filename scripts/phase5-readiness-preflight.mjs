import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function gitSucceeds(...args) {
  return spawnSync("git", args, { stdio: "ignore" }).status === 0;
}

const phase4Ref = valueAfter("--phase4-ref");
const registerPath = valueAfter("--gate-register") ?? "docs/phase-5/RELEASE_GATE_REGISTER.json";

if (process.argv.includes("--help")) {
  console.log("Usage: node scripts/phase5-readiness-preflight.mjs --phase4-ref <immutable-ref> [--gate-register <path>]");
  process.exit(0);
}

const requiredGateFields = [
  "id", "description", "originPhase", "riskCategory", "owner", "status", "acceptanceCriteria",
  "evidenceLocation", "reviewer", "dateOpened", "dateTechnicallyCompleted", "dateApproved",
  "remainingActions", "pilotImpact", "productionImpact", "regionalExpansionImpact",
];
const register = JSON.parse(fs.readFileSync(registerPath, "utf8"));
const registerErrors = [];
const seen = new Set();
for (const gate of register.gates ?? []) {
  if (seen.has(gate.id)) registerErrors.push(`Duplicate gate: ${gate.id}`);
  seen.add(gate.id);
  for (const field of requiredGateFields) if (!(field in gate)) registerErrors.push(`${gate.id}: missing ${field}`);
  if (!register.allowedStatuses?.includes(gate.status)) registerErrors.push(`${gate.id}: invalid status ${gate.status}`);
}

const worktree = git("status", "--porcelain=v1", "--untracked-files=all").split(/\r?\n/).filter(Boolean);
const report = {
  generatedAt: new Date().toISOString(),
  currentBranch: git("branch", "--show-current") || null,
  head: git("rev-parse", "HEAD"),
  phase4Ref: phase4Ref ?? null,
  worktreeClean: worktree.length === 0,
  worktree,
  gateRegister: registerPath,
  gateRegisterValid: registerErrors.length === 0,
  gateRegisterErrors: registerErrors,
};

if (!phase4Ref || !gitSucceeds("rev-parse", "--verify", `${phase4Ref}^{commit}`)) {
  console.log(JSON.stringify({ ...report, status: "blocked", gate: "PHASE4-INTEGRATION-001", reason: "An immutable Phase 4 commit ref was not supplied or does not resolve." }, null, 2));
  process.exit(2);
}

const immutableCommit = git("rev-parse", `${phase4Ref}^{commit}`);
const phase3Ref = "origin/codex/phase3-casework";
const mergeBase = gitSucceeds("rev-parse", "--verify", `${phase3Ref}^{commit}`) ? git("merge-base", immutableCommit, phase3Ref) : null;
const phase4Distinct = immutableCommit !== (gitSucceeds("rev-parse", "--verify", `${phase3Ref}^{commit}`) ? git("rev-parse", `${phase3Ref}^{commit}`) : null);
const pilotBlockingGates = (register.gates ?? []).filter((gate) => gate.status !== "Closed" && gate.pilotImpact.startsWith("Blocks"));
const ready = worktree.length === 0 && registerErrors.length === 0 && phase4Distinct && pilotBlockingGates.length === 0;

console.log(JSON.stringify({
  ...report,
  status: ready ? "ready-for-authorised-pilot-review" : "blocked",
  immutableCommit,
  phase3MergeBase: mergeBase,
  phase4Distinct,
  pilotBlockingGates: pilotBlockingGates.map((gate) => gate.id),
  ready,
}, null, 2));
process.exit(ready ? 0 : 2);
