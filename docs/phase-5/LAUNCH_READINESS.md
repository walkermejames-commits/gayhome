# Launch readiness

The launch checklist creates blocking items for security, privacy, safeguarding, accessibility, data verification, legal content, infrastructure, backup, restore, authentication, encryption, evidence, consent, support, incident response, monitoring, insurance, governance, communications and partner readiness.

Each item records owner, status, evidence, risk, approver, blocking effect and completion time. Critical blocking items must be complete or specifically approved as not applicable. Application code never closes human gates automatically.

Production is blocked by three independent controls: `PRODUCTION_ACTIVATION_ENABLED=true` is rejected by environment validation; `production.public_access` cannot be enabled through the feature API; and PHASE5-LAUNCH-001 remains blocked until formal approval. The release preflight also rejects production deployment through this workflow.

Technical evidence can demonstrate migrations, tests, dataset integrity, default flag states and smoke-test results. It cannot substitute for safeguarding ownership, DPIA/legal approval, manual accessibility testing, independent penetration testing, insurance or executive launch approval.
