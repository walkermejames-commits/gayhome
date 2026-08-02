# Phase 6 integration blocker

## Blocking condition

The authoritative Phase 6 implementation is absent from the canonical Git repository. The repository contains no Phase 6 branch, commit, tag or pull request that can be provenance-checked and integrated into the verified Phase 5 baseline.

This is a source-availability blocker, not an implementation defect in the Phase 5 baseline. Reconstructing Phase 6 from its planning instruction would create unverified substitute code and is explicitly prohibited.

## Required material

Provide one of the following from `https://github.com/walkermejames-commits/gayhome.git`:

- the exact authoritative Phase 6 branch name;
- the exact authoritative Phase 6 commit hash;
- an authoritative Phase 6 tag; or
- an authoritative Phase 6 pull request whose head commit is reachable and reviewable.

The source must include the actual Phase 6 implementation and its migrations, tests and documentation, if those artifacts are part of that implementation. A planning prompt or feature list is not sufficient.

## Resume procedure

After the source is made reachable:

1. Fetch the canonical remote without rewriting history.
2. Verify source commit identity, parentage and merge base against Phase 5 commit `15bf783455d9c84f630fbfd5dbf0c099601a32f0`.
3. Inspect the source for secrets, personal data, migration conflicts and safeguarding contradictions before integrating it.
4. Integrate on `codex/phase6-integration`, preserve existing Phase 5 controls and resolve only evidence-backed conflicts.
5. Run the required migration, security, accessibility, dataset and application validation suites.
6. Update `PHASE6-INTEGRATION-001` with technical evidence, while leaving human approvals open for their authorised reviewers.

Until then, no Phase 6 capability is represented as implemented, integrated, tested or approved.
