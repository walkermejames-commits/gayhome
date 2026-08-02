# Incident response runbook

## Severity

P0 is a critical safety, privacy, security or availability event requiring immediate command. P1 is high and time-sensitive. P2 is material but containable through normal incident handling. P3 is standard operational work.

## Response

1. Assign the incident commander and safeguarding lead where relevant.
2. Record affected system and aggregate affected-record count without narratives.
3. Contain using the smallest audited action: disable a flag, pause registration, disable evidence/email/invitations, hide a dangerous service reference or pause the pilot.
4. Preserve logs and database evidence without copying personal data into chat or general tickets.
5. Set a safe communication status and assess regulator/controller notification with the accountable privacy owner.
6. Identify root cause, implement remediation, monitor and record a post-incident review.

Every emergency action stores target, actor, reason, previous state and new state. Disabling is always available to an authorised incident role; enabling remains subject to release-gate dependencies. A hidden service is not silently reactivated: controlled correction and dataset revision review are required.

Rollback preparation records the target version and backup reference. It does not execute a deployment or rollback. P0/P1 tabletop exercises and shutdown tests are required before PHASE5-INCIDENT-001 can receive human approval.
