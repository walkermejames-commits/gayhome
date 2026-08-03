# Phase 6 security review

Reviewed 2026-08-02 against the repository’s Next.js/React security baseline.

## Phase 6 controls verified

- Every administrative/report page uses a server-side role query; every partner workspace uses a server-side organisation/user/agreement query.
- Partner status and roles have no case permission path. The migration proof finds zero partner-table foreign keys to `cases`; tests independently force partner case access false.
- Proposal writes require a trusted same origin, JSON content type, strict runtime schema, active organisation agreement, editor role, and verified service assignment. Evidence bytes/unknown fields are rejected; only a bounded reference is stored. Responses are no-store and writes are audited.
- Provider actors cannot transition proposals to published. Sussex publication and all ten Phase 6 flags remain false. Adapters fail closed, minimise payloads and cannot submit council forms without a later verified/approved configuration.
- Commissioner output uses aggregate inputs with a non-reducible minimum cell of five and has no case repository access.
- Offline allowlists exclude case, account, consent, profile and evidence paths. No service worker, install prompt, push registration, external request or submission was added.
- React renders content as text; there is no `dangerouslySetInnerHTML`, string-to-code execution, postMessage or user-controlled outbound fetch in Phase 6. Translation draft validation rejects common active-content schemes.
- Guest preferences contain presentation settings only, are runtime-validated after reading session storage, and never store tokens or case data.

Automated security tests cover partner escalation, cross-organisation edits, publication bypass, regional access, cross-region transfer, re-identification/small cells, translation injection, malicious evidence fields, adapter secret minimisation, offline leakage, lock-screen redaction, flag bypass and Sussex activation. Synthetic migration testing preserves Kent records, cases and permissions through rollback/reapply.

## Dependency finding

`pnpm audit --audit-level high` passes with no high or critical advisory. The full audit reports one moderate development-only transitive advisory: `esbuild` 0.18.20 through `drizzle-kit` / `@esbuild-kit`, GHSA-67mh-4wv8-2f99. The affected development server must not be exposed to untrusted networks. Resolving it may require an authoritative tooling upgrade on the integration branch; Phase 6 does not broaden shared dependency changes in parallel.

## Residual human gates

This review does not close `PARTNER-001`, `PROVIDER-001`, `TRANSLATION-001`, `OFFLINE-001`, `REPORTING-001`, `PWA-001`, `ADAPTER-001`, `REGION-001`, `SUSSEX-DATA-001` or `PHASE6-INTEGRATION-001`. Runtime penetration testing, infrastructure checks, route/middleware integration review, real provider workflow review and re-identification analysis remain required.
