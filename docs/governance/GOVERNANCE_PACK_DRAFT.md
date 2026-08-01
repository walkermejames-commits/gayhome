# Governance pack

Status: **Draft — awaiting authorised human review.** This document does not close `GOV-001`.

## DPIA and data flow

Purposes are crisis routing, service discovery, user-directed document preparation, optional encrypted profile reuse and consented advocate support. Public catalogue reads contain no personal data. Guest/public-device answers remain in memory. Optional account email and profile facts flow from the browser over HTTPS to PostgreSQL; sensitive values are AES-256-GCM encrypted before storage. Evidence files remain disabled until approved object storage exists. External submissions are user-directed only. Risks include unsafe device access, disclosure of special-category data, incorrect service information, gatekeeping harm and key compromise; controls include device modes, no-store responses, quick exit, deterministic routing, provenance, temporal contacts, field-level consent and fail-closed release gates.

Proposed lawful bases require legal confirmation: public task or legitimate interests for public navigation; contract/consent as appropriate for optional user services; UK GDPR Article 9 explicit consent or substantial-public-interest condition for special-category data. Safeguarding is not a blanket basis for routine storage. Criminal-offence and immigration data require separate documented conditions before persistence.

## Processing-purpose register and retention

Public searches: no server persistence. Authentication links: 15 minutes, audit outcome only. Sessions: public device 30 minutes; private account maximum 30 days with revocation. Active profile facts: user controlled; annual review proposed, with shorter freshness warnings by field. Deleted-account grace period: proposed 30 days; legal/security exceptions must be disclosed per request. Security audit events: proposed 12 months. Reconciliation and published dataset provenance: retained as an operational public-interest record. Final periods require DPO/legal approval.

## Rights, corrections and complaints

Provide authenticated export, rectification, restriction, objection and deletion-request routes. Verify identity proportionately, log the request without sensitive narrative, respond within statutory timescales, disclose retention exceptions, and provide escalation to the controller/DPO and ICO. User corrections to service data enter reconciliation; they never silently overwrite published records.

## Safeguarding and emergency content

The service is not emergency response. Immediate danger remains prominent and uses controlled records. Staff must not promise accommodation, demand profile completion, infer identity, or override deterministic critical routes. A named safeguarding lead must approve escalation thresholds, referral handling, out-of-hours cover and emergency wording before launch. Emergency content requires two-person source verification, dated approval, fallback testing and rollback capability.

## Ownership and editorial procedure

Assign accountable owners for: product, controller/DPO, safeguarding, security incident command, database recovery, encryption keys, service verification, council content, accessibility and complaints. Service contacts are checked against primary sources on their review cycle; changes are imported, reconciled, approved and published as a new immutable revision. Provider contacts have a correction route and cannot edit live records directly.

## Incident, breach and continuity

Triage severity, contain access, preserve minimal evidence, rotate affected keys/secrets, revoke sessions, restore only into isolation, verify controlled data and record decisions. The DPO decides notification obligations and timing. Business continuity uses cached public controlled assets, provider-native database recovery, a maintained emergency fallback, documented recovery objectives and rehearsed ownership. Do not log names, identities, abuse, health, immigration, addresses, letters or evidence.

## AI governance and human review

No generative model selects crisis routes, invents services or inserts facts. Language interpretation may suggest editable structured needs; deterministic rules make the final match. Humans approve dataset publication, emergency content, governance, accessibility evidence, external integrations and production release. Model or rule changes require documented evaluation, safeguarding review and rollback.

## Approval record

Required sign-offs: controller/DPO; safeguarding lead; security lead; accessibility lead; editorial owner; service owner. Record name, role, decision, date, conditions and superseded version. Until all are signed, status remains awaiting review.
