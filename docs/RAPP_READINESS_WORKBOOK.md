# RAPP Readiness Workbook

**Product:** Kent LGBTQIA+ Housing and Homelessness Navigator  
**Repository:** `walkermejames-commits/gayhome`  
**Purpose:** a working checklist for taking the existing safety-critical app from code-complete prototype to a controlled, safe public release.  
**Last reviewed:** 22 August 2026  
**Rule:** a checked item needs evidence: a command result, screen recording, document, named approval, or dated test note.

## Current position

The app already has a substantial working foundation:

- controlled Kent dataset revision `v1.0.1`, with 60 services, 13 councils, 12 triage routes, 12 scripts, 12 evidence categories and 73 sources;
- public routes for help-now, triage, plans, applications, support, councils, letters, evidence, case support, privacy, accessibility and discreet mode;
- PostgreSQL schema, migration, import, idempotency/conflict handling, backup and restore proof;
- safe reviewed hand-off for seven application flows, with copy/print/PDF only and no direct submission;
- authentication and encryption foundations, disabled persistent private profile UI, secure cookies, rate limits, audit controls and production security headers;
- automated accessibility coverage, TypeScript, lint, test, dataset audit, PostgreSQL deployment proof and production dependency audit all passing.

This is **not public-launch ready**. Staging is not deployed. Persistent sensitive data and evidence uploads must stay disabled until the open security, accessibility and governance gates close.

## Launch dashboard

| Gate | Current state | Release decision |
| --- | --- | --- |
| DATA-001 | Closed | Keep source and revision controls intact. |
| DEPLOY-001 | Code/test acceptance closed | Complete external staging deployment and operational rehearsal. |
| AUTH-001 | Partly complete | Keep persistent private profiles disabled. |
| ACCESS-001 | Open | Do not launch publicly until manual access testing is signed off. |
| GOV-001 | Open | Do not launch publicly until named owners and approvals exist. |

## 1. First working session — establish the baseline

- [ ] Clone or open the `gayhome` repository.
- [ ] Install the supported Node.js and pnpm versions.
- [ ] Copy `.env.example` to `.env`; do not add secrets to Git.
- [ ] Run `pnpm install`.
- [ ] Run `pnpm audit:dataset`.
- [ ] Run `pnpm import:datasets`.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm dev` and make a dated note of the local URL and any errors.
- [ ] Confirm the home page, Help Now, Triage, My Plan, Support, Councils, Letters, Privacy, Accessibility and Discreet Mode all render.
- [ ] Create one clean baseline commit only if the working tree needs no unrelated changes.

**Evidence to attach:** terminal output or CI run link; a short “baseline works / blocked by…” note.

## 2. Protect and maintain the content dataset

- [ ] Treat `data/source/` as immutable evidence; never silently overwrite or “tidy” source records.
- [ ] Confirm `v1.0.1` remains the active controlled revision.
- [ ] Assign an editorial owner for every Kent contact record.
- [ ] Verify all **critical** and **high** entries before staging: emergency services, NHS 111, local council emergency housing contacts, domestic-abuse support, Galop, akt, Samaritans, StreetLink, Porchlight and other same-night routes.
- [ ] Confirm that retired or unavailable contact channels remain hidden in public results.
- [ ] Set a monthly review rhythm for critical/high services and a quarterly review rhythm for all other services.
- [ ] Create an urgent correction route for a dangerous or incorrect listing.
- [ ] Require a source URL, verification date, editor name and change note for every published update.
- [ ] Keep an approved rollback route to the prior revision.
- [ ] Add Sussex only after its dataset passes the same source, legal, safeguarding and editorial checks separately.

**Never claim:** that a person is eligible, that a bed is available, that a council will provide accommodation, or that an outcome is legally guaranteed.

## 3. Finish staging deployment

- [ ] Choose the hosting platform and a UK/EU PostgreSQL provider.
- [ ] Provision a separate staging database; do not use a production database for testing.
- [ ] Add staging environment variables through the platform’s secret manager.
- [ ] Run `pnpm db:migrate` in staging.
- [ ] Seed/import the approved `v1.0.1` revision.
- [ ] Verify `GET /api/v1/health` returns only safe operational information.
- [ ] Run `pnpm db:test:deploy` against an isolated test environment, not live data.
- [ ] Perform a backup and restore rehearsal with the hosted provider.
- [ ] Confirm point-in-time recovery options, retention period, restore owner and contact path.
- [ ] Configure monitoring and error alerts that never record sensitive profile or case content.
- [ ] Confirm CSP, HTTPS, noindex and security headers are active in staging.
- [ ] Write the staging URL, deploy owner and rollback instructions in `docs/deployment/`.

**Exit condition:** a non-public staging site works from a phone and desktop, survives a database restore drill, and can be rolled back.

## 4. Complete the core public experience

- [ ] Test the first screen with a person who needs help tonight: immediate danger must lead to 999; no safe place tonight must lead to the appropriate emergency council route and support options.
- [ ] Make each triage outcome short, ordered and action-led rather than a large list of services.
- [ ] Review all language to make it non-judgmental, affirming and plain-English.
- [ ] Add or finish postcode/district lookup using an approved authoritative source; do not rely on unverified current-location guesses.
- [ ] Test Kent and Medway council routing for every supported area.
- [ ] Check all seven application-preparation flows.
- [ ] Confirm every value is editable or removable before print, copy or PDF hand-off.
- [ ] Confirm that nothing is submitted automatically to a council, landlord, provider or third party.
- [ ] Confirm LGBTQIA+ identity, gender identity and sexuality are never autofilled.
- [ ] Confirm safety, abuse, immigration and health fields stay optional and are never exposed in URLs, notifications or page titles.
- [ ] Make support for someone else clear without inviting unsafe data sharing.
- [ ] Test the discreet mode and quick-exit control on mobile and desktop.

## 5. Keep private data switched off until AUTH-001 closes

- [ ] Do not enable account-backed profile, case or evidence storage yet.
- [ ] Select and approve a transactional email provider for passwordless sign-in.
- [ ] Implement approved email delivery, expiry handling, bounce handling and recovery/change-email flow.
- [ ] Move production encryption keys to a managed secret/key system.
- [ ] Record key ownership, rotation frequency, rotation rehearsal and emergency revocation procedure.
- [ ] Complete persistent encrypted profile and consent APIs.
- [ ] Complete account export in a user-readable format.
- [ ] Build the deletion worker and deletion-completion audit record.
- [ ] Add encrypted object storage only if evidence upload becomes an approved feature.
- [ ] Write tests for cross-user access, session theft, CSRF, rate limits, token reuse, deleted accounts and encrypted-data recovery.
- [ ] Commission or conduct an independent security review before enabling saved sensitive data.

**AUTH-001 exit condition:** all private data paths are encrypted, reviewed, deletion-tested, operationally owned and independently tested.

## 6. Accessibility testing — ACCESS-001

- [ ] Follow `docs/accessibility/MANUAL_TEST_PLAN.md`.
- [ ] Test keyboard-only navigation across every critical journey.
- [ ] Test NVDA with a supported Windows browser.
- [ ] Test VoiceOver with Safari on iPhone/iPad or Mac.
- [ ] Test Android TalkBack where the public app will support Android devices.
- [ ] Test 200% and 400% zoom, text reflow and small-screen layout.
- [ ] Test high contrast, reduced motion, focus visibility and error messaging.
- [ ] Test with users who are deaf/disabled, including people who need low-cognitive-load wording.
- [ ] Fix every blocker and retest it.
- [ ] Produce a dated accessibility statement with known limitations and contact route.
- [ ] Obtain sign-off from the accountable accessibility reviewer.

**ACCESS-001 exit condition:** every core journey has documented manual results; no known critical accessibility blocker remains.

## 7. Safeguarding, legal and operational ownership — GOV-001

- [ ] Turn `docs/governance/GOVERNANCE_PACK_DRAFT.md` into an approved governance pack.
- [ ] Name the product owner.
- [ ] Name the content/editorial owner.
- [ ] Name the safeguarding lead.
- [ ] Name the privacy/DPO decision owner.
- [ ] Name the technical/security owner.
- [ ] Name the incident-response owner and their cover arrangement.
- [ ] Obtain legal review of housing-information wording, disclaimers and council hand-off flows.
- [ ] Complete and approve the DPIA.
- [ ] Agree the safeguarding escalation policy: what is in scope, what is not, and what happens when someone discloses immediate danger.
- [ ] Write an incident runbook for incorrect services, data breach, provider complaint, abuse of the platform, outage and emergency content correction.
- [ ] Define business hours and realistic support expectations; never imply 24/7 human casework unless that exists.
- [ ] Confirm insurance, terms, privacy notice, cookie position and accessibility statement.
- [ ] Store signed approvals and review dates in the repository’s governance area.

**GOV-001 exit condition:** named humans—not just code—are accountable for safety, data, content and incidents.

## 8. Lived-experience and service-partner pilot

- [ ] Recruit a small moderated pilot group before any public announcement.
- [ ] Include LGBTQIA+ people with lived experience of homelessness or housing insecurity.
- [ ] Include at least one frontline housing or advocacy worker.
- [ ] Offer payment or vouchers for participants where budget permits.
- [ ] Test three scenarios: unsafe tonight, threatened with homelessness, and a person helping someone else.
- [ ] Ask what is confusing, unsafe, shaming, hard to read or missing.
- [ ] Record issues without retaining unnecessary personal stories.
- [ ] Prioritise safety-critical and comprehension issues first.
- [ ] Run a second pilot after fixes.
- [ ] Ask pilot users to confirm whether the language and flow feel respectful and useful.

## 9. Release checklist

- [ ] DATA-001 remains green.
- [ ] Staging deployment and hosted backup/restore rehearsal complete.
- [ ] AUTH-001 closed before persistent private data is enabled.
- [ ] ACCESS-001 closed with manual test evidence.
- [ ] GOV-001 closed with named accountable owners and approvals.
- [ ] Emergency and council routes rechecked immediately before launch.
- [ ] Production secrets are stored outside source control.
- [ ] Monitoring, alerts, backups, rollback and incident contacts are tested.
- [ ] Public privacy notice, accessibility statement and safety disclaimer are live.
- [ ] A controlled pilot release happens before a broad public launch.
- [ ] A named person monitors the first week and handles corrections.

## 10. First three actions

1. Get the app running locally and capture the exact result of the baseline commands.
2. Decide who owns the Kent service directory and arrange re-verification of the critical routes.
3. Choose a staging host and PostgreSQL provider, then deploy the app only to a private staging URL.

## Notes log

Use this section as the living record.

| Date | Area | What changed / was learned | Owner | Evidence / link | Next action |
| --- | --- | --- | --- | --- | --- |
| 2026-08-22 | Workbook created | Readiness plan added after review of Phase 2 completion report. | James | `docs/RAPP_READINESS_WORKBOOK.md` | Complete baseline session. |
