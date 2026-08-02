# Pilot operating model

## Default state

Every pilot begins as a draft and every Phase 5 feature flag begins disabled. Emergency public information remains available outside participation. A cohort describes a bounded participant type, date range, maximum size, permitted features, support model, consent notice version, permitted data and exit criteria.

## Accountable roles

The pilot record requires safeguarding, technical, editorial, data-verification, support and incident owners. Operational assignments are approved, scoped by pilot or region, expirable, suspendable and revocable. An administrator role is accepted for transition compatibility, but API checks remain server-side.

## Entry and activation

Pilot approval types are recorded separately for pilot, safeguarding, governance, accessibility, security, data, support, incident and recovery. A pilot becomes approved only when every required approval has human evidence. Activation preflight checks status, an approved cohort, maximum participants, all named owners, support configuration, recovery evidence, current migrations, dataset status, blocking gates and false defaults.

Activation additionally requires the dedicated pilot environment and an explicit disabled-by-default environment control. Local development, test, staging and production cannot activate a pilot. No production command is provided.

## Participant control

Invitations use one-time hashed tokens and eligible approved cohorts only. Accepting an invitation shows versioned information but does not imply consent. Service use, pilot participation, optional feedback, optional research and optional post-pilot contact are distinct receipts. The participant becomes active only after the two required choices are separately granted. Revocation pauses participation when required consent is absent. Withdrawal revokes every optional receipt and records export/deletion requests without erasing governed audit history.

## Pause, stop and exit

Incident commanders can pause registration, disable features or pause a pilot with an audited reason. Completion and archival preserve the configuration, approvals and operational history. Pilot limits are never increased implicitly and outcomes remain optional.
