import { execFileSync, spawnSync } from "node:child_process";

function valueAfter(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function git(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function gitSucceeds(...args) {
  return spawnSync("git", args, { stdio: "ignore" }).status === 0;
}

function lines(value) {
  return value ? value.split(/\r?\n/).filter(Boolean) : [];
}

function fail(message) {
  console.error(JSON.stringify({ status: "error", message }, null, 2));
  process.exit(1);
}

const baselineRef = valueAfter("--baseline") ?? "origin/codex/phase2-completion";
const phase3Ref = valueAfter("--phase3-ref");

if (process.argv.includes("--help")) {
  console.log(
    "Usage: node scripts/phase4-integration-preflight.mjs [--baseline <ref>] --phase3-ref <actual-ref>",
  );
  process.exit(0);
}

if (!gitSucceeds("rev-parse", "--verify", `${baselineRef}^{commit}`)) {
  fail(`The confirmed baseline ref does not resolve to a commit: ${baselineRef}`);
}

const baselineCommit = git("rev-parse", `${baselineRef}^{commit}`);
const worktreeStatus = lines(git("status", "--porcelain=v1", "--untracked-files=all"));
const fetchedRefs = lines(
  git(
    "for-each-ref",
    "--sort=-committerdate",
    "--format=%(refname)|%(objectname)|%(committerdate:iso8601)|%(subject)",
    "refs/remotes",
    "refs/tags",
  ),
);

const report = {
  generatedAt: new Date().toISOString(),
  baseline: { ref: baselineRef, commit: baselineCommit },
  currentBranch: git("branch", "--show-current") || null,
  worktreeClean: worktreeStatus.length === 0,
  worktreeStatus,
  fetchedRefs,
};

if (!phase3Ref) {
  console.log(
    JSON.stringify(
      {
        ...report,
        status: "blocked",
        gate: "PHASE3-INTEGRATION-001",
        reason:
          "No actual Phase 3 ref was supplied. Discover and fetch the real ref; do not infer it from the planned specification.",
      },
      null,
      2,
    ),
  );
  process.exit(2);
}

if (!gitSucceeds("rev-parse", "--verify", `${phase3Ref}^{commit}`)) {
  fail(`The supplied Phase 3 ref does not resolve to a fetched commit: ${phase3Ref}`);
}

const phase3Commit = git("rev-parse", `${phase3Ref}^{commit}`);
const mergeBase = git("merge-base", baselineCommit, phase3Commit);
const changedFiles = lines(git("diff", "--name-only", `${mergeBase}..${phase3Commit}`));
const migrationFiles = changedFiles.filter((path) => path.startsWith("migrations/"));
const apiFiles = changedFiles.filter(
  (path) => path.startsWith("src/app/api/") || path.includes("/api/"),
);
const baselineIsAncestor = gitSucceeds("merge-base", "--is-ancestor", baselineCommit, phase3Commit);
const distinctFromBaseline = phase3Commit !== baselineCommit;
const integrationReadyForReview =
  worktreeStatus.length === 0 && baselineIsAncestor && distinctFromBaseline;

console.log(
  JSON.stringify(
    {
      ...report,
      status: integrationReadyForReview ? "ready-for-human-review" : "blocked",
      gate: "PHASE3-INTEGRATION-001",
      phase3: { ref: phase3Ref, commit: phase3Commit },
      mergeBase,
      baselineIsAncestor,
      distinctFromBaseline,
      changedFileCount: changedFiles.length,
      changedFiles,
      migrationFiles,
      apiFiles,
      integrationReadyForReview,
      nextAction: integrationReadyForReview
        ? "Inspect the complete diff and fill in the integration audit before merging."
        : "Resolve the reported baseline, ref, or worktree condition without resetting or discarding work.",
    },
    null,
    2,
  ),
);

process.exit(integrationReadyForReview ? 0 : 2);
