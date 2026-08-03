# Phase 6 integration security review

Technical review confirms:

- Phase 6 administrative pages perform server-side role checks.
- Partner access requires a signed-in user, active Phase 5 membership, approved/active and verified organisation, approved organisation agreement, and an unexpired active agreement record.
- The proposal API enforces trusted origin, JSON content type, strict Zod validation, organisation scope, verified managed-service scope, audit logging, no-store responses and safe errors.
- Proposals enter `service_correction_proposals` as pending and cannot mutate or publish live records.
- Partner tables have no foreign-key path to cases; domain policy always returns `caseAccess: false`.
- Commissioner views require administrator/commissioner roles and operate on aggregate structures with a minimum cell size of five.
- Offline caching rejects private routes; adapters, council submission, PWA, push, live translation and cross-region transfer remain disabled.
- Sussex publication is hard-blocked in domain logic, database publication state and the release-gate register.

Automated evidence includes 95 unit/security/accessibility tests, 15 Phase 3 persona journeys, Phase 4 access/revocation regression tests, Phase 5 pilot safeguards and the Phase 6 integration/migration proof. `pnpm secret:scan` passed. Production dependency audit reported no known vulnerability; the full development audit reports one moderate transitive advisory and no high/critical advisory.

Open independent reviews: regional isolation, partner permissions, provider workflow, reporting re-identification, offline/shared-device privacy, adapter security, penetration testing and human safeguarding governance. These are represented by open gates and are not closed by this technical integration.
