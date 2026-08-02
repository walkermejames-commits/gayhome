# Controlled Kent pilot operating-model template

Status: **Template only — pilot execution is blocked by `PHASE4-INTEGRATION-001`.**

No bracketed field may be inferred or auto-approved. The accountable human must be named before the relevant cohort starts.

## Pilot definition

| Field | Approved value |
|---|---|
| Purpose | `[approved purpose]` |
| Geography | Kent/Medway area explicitly approved: `[area]` |
| Start date and duration | `[date]`; `[duration]` |
| Maximum active users | `[number]` |
| Maximum active caseworkers | `[number]` |
| Participating organisations | `[approved organisations]` |
| Support hours and channels | `[staffed hours; secure/text/relay/telephone options]` |
| Safeguarding lead/deputy/cover | `[names and approved route]` |
| Incident commander/deputy | `[names and approved route]` |
| Technical owner | `[name]` |
| Editorial/data-verification owners | `[names]` |
| Accessibility support owner | `[name and channel]` |
| Feedback and complaints owner | `[name and channel]` |
| Pause/stop decision maker | `[name/role]` |
| Rollback owner and version | `[name]`; `[immutable version]` |

## Cohort sequencing

| Cohort | Data | Entry criteria | Exit criteria | Default state |
|---|---|---|---|---|
| 1. Internal staff | Synthetic only | Immutable Phase 4 ref, isolated staging, named incident/safeguarding owners, monitoring and rollback | Critical defects resolved; simulated P0/P1 and rollback completed | Blocked |
| 2. Lived-experience testers | Controlled scenarios; no unnecessary personal data | Cohort 1 exit, accessible consent/support, compensation and trauma-informed protocol | Accessibility/distress findings triaged and high-risk defects retested | Blocked |
| 3. Partner professionals | Synthetic and explicitly approved consented pilot data | Role training, assignment controls, DPIA/governance approval and support | Permission/consent workload acceptable; incidents resolved | Blocked |
| 4. Small real-user group | Minimum necessary consented data | Pilot-critical gates approved; direct support and safeguarding cover live | No unaccepted critical risk; outcomes and trust acceptable | Blocked |
| 5. Expanded Kent pilot | Approved controlled scope | Prior cohort exit and formal expansion approval | Formal public-beta readiness decision | Blocked |

No cohort authorises the next automatically.

## Feature-flag policy

The technical implementation must enforce the matrix in `PILOT_FEATURE_FLAG_MATRIX.json`. Written instructions are not a control. Flags must be environment-specific, audited, fail closed, and incapable of enabling a feature whose release gate is not approved.

## Included/disabled features

Until gates change, only public catalogue and synthetic internal journeys may be considered for Cohort 1. Persistent real profiles, evidence bytes, external email, advocate invitations, professional accounts, external packs, notifications, referrals, direct submission, AI case summaries and Sussex routing remain disabled.

## Pause and stop criteria

Pause registrations or the affected feature for any loss of monitoring, support, recovery, data verification or named cover. Stop the pilot for a P0 event, cross-user disclosure, broken revocation, unsafe emergency route, critical accessibility barrier, safeguarding contradiction, database corruption, key compromise, failed rollback, or instruction from the accountable owner.

## Exit evidence

Record aggregate users, completed/failed journeys, incidents, accessibility findings, support demand, data corrections, permission denials, outcomes, changes and residual risk. Never place case narratives or small-cell identity combinations in the pilot report.
