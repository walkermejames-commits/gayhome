# Pilot support and incident template

Status: **Template only — no staffed pilot support or safeguarding operation currently exists.**

## Support intake

Every request must be classified as technical problem, data correction, accessibility problem, housing-content concern, safeguarding concern, privacy concern, security concern, complaint, feature request, user confusion, or positive outcome. Store minimum necessary information, use a pseudonymous event ID, and never place evidence or case narratives in ordinary ticket metadata.

Safeguarding, privacy, and security concerns require an immediate alert to the separately named accountable owner. They must not wait in an ordinary technical queue. Emergency wording must direct immediate danger to the controlled emergency route; support is not an emergency service.

| Category | Triage owner | Escalation owner | Target during approved staffed hours | Outside staffed hours |
|---|---|---|---|---|
| Technical/data/accessibility/content | `[owner]` | `[service owner]` | `[approved target]` | Display honest next-staffed time and emergency alternatives where relevant |
| Safeguarding | `[trained intake role]` | `[DSL/deputy]` | Immediate human alert | `[approved out-of-hours process]` |
| Privacy/security | `[trained intake role]` | `[DPO/security incident commander]` | Immediate human alert | `[approved out-of-hours process]` |
| Complaint | `[complaints owner]` | `[independent escalation]` | `[approved target]` | Acknowledge next staffed period |

Do not claim 24-hour human cover unless the approved rota proves it.

## Incident levels

### P0 — immediate critical

Life risk, active child-safeguarding failure, large-scale data exposure, cross-user evidence exposure, unsafe emergency routing, key compromise or database corruption. Immediately contain, appoint the named commander, alert safeguarding/emergency leadership as applicable, disable the affected feature/service, preserve evidence, assess regulatory/user communication and invoke recovery.

### P1 — high severity

Single-user sensitive exposure, broken revocation, seriously incorrect council route, persistent authentication failure, wrong-recipient communication or a critical accessibility barrier. Contain during the same staffed response window, notify the accountable owner, determine affected users, preserve evidence and decide whether to pause the cohort or feature.

### P2 — material service problem

Broken form/PDF, missing service, incorrect hours, delayed notification or major usability failure. Assign an owner, provide a safe workaround if approved, correct through controlled change and retest.

### P3 — standard issue

Low-impact display, wording or usability issue. Triage through normal review without displacing higher-severity work.

## Required incident record

Record pseudonymous incident ID, detection, time, severity, affected feature/environment/release/dataset revision, commander, safeguarding/privacy/security owners involved, containment, evidence preservation, user/regulator assessment, recovery, verification, communications decision, follow-up owner and post-incident review. Do not copy sensitive content into the incident timeline.

## Daily pilot report template

Record uptime, aggregate users/journeys, errors, permission denials, support categories, data corrections, accessibility reports, safeguarding/security incident counts, critical-source status, decisions, owners and next review. Apply minimum-cell suppression and exclude narratives.
