# Phase 5 integration contract

## Baseline

Phase 5 applies after migrations 0001–0004 and preserves users, profiles, consent receipts, dataset revisions, cases, access grants and Phase 4 controls. Migration 0005 is additive. The deployment proof rolls 0005 back before 0004/0003, seeds Phase 2 data, reapplies all integration migrations and verifies data parity plus logical backup/restore.

## Invariants

- All Phase 5 and production flags have database-constrained false defaults.
- Human approval gates remain open until an accountable reviewer closes them.
- Pilot activation is environment-specific and disabled by default.
- Production activation is unavailable through local commands and APIs.
- External delivery and evidence bytes remain governed by MAIL-001 and EVIDENCE-001.
- Participant choices are granular, revocable and auditable.
- Operational listings omit encrypted narratives and contact values.
- Partner corrections never directly mutate controlled records.
- Aggregate reports suppress groups below five.
- Administrative and emergency actions are role/scope checked and audited.

## Compatibility and rollback

Runtime services use explicit PostgreSQL transactions. API route parameters use the Next.js asynchronous `params` contract. Down migration refuses unsafe removal while a pilot is active/paused or a release is live. Logical backup includes all Phase 5 tables. A future migration must preserve these invariants and extend the backup table list and deployment lifecycle test.

## Acceptance boundary

Passing automated tests establishes technical implementation only. It does not approve pilot activation, real participants, external communications, evidence storage, partner access, public analytics or production launch. Those boundaries are represented by unresolved release gates and false feature flags.
