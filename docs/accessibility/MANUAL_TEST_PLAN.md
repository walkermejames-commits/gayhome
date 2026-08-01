# Accessibility verification plan

Status: **Draft — tests requiring people/devices remain open.**

Test every primary journey by keyboard at 100%, 200% and 400% zoom and 320 CSS-pixel reflow. Record focus order/visibility, skip links, landmarks, labels, instructions, live errors, safe exit, touch targets, text spacing, forced colours, reduced motion, print and voice-control names. Run NVDA with current Chrome and Firefox on Windows; VoiceOver with Safari and Mobile Safari; current Edge, Mobile Chrome and Safari. Tasks cover urgent triage, council selection, filtered service lookup, action plan, reviewed application export, script editing, evidence status and guest/public-device exit. Record defect, severity, fix commit and retest.

Moderated lived-experience sessions must include LGBTQIA+ participants with homelessness experience, accessible recruitment/consent, trauma-informed facilitation, compensation, safe withdrawal and no production personal data. Only an authorised accessibility reviewer may sign `ACCESS-001`.

## Phase 3 additions

Run the checks above on the case dashboard, timeline, evidence metadata form, consent centre, advocate invitation, PDF preview/download, document workflow, deadlines, suitability, complaints, reviews and each restricted admin queue. Verify status announcements, fieldsets, timeline reading order, deadline certainty labels and export manifests. At 400% zoom, two-dimensional scrolling is allowed only for the deliberately horizontally scrollable case navigation.

Upload alternatives, upload progress and preview cannot be signed off while `EVIDENCE-001` is open. Complete the fifteen Phase 3 personas with disabled, LGBTQIA+ and public-device participants before closing `ACCESS-001` or `PDF-001`. Automated axe coverage is a regression control, not a substitute for these tests; no manual Phase 3 result is recorded yet.
