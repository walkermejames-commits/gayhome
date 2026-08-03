# Phase 6 accessibility evidence and manual plan

Automated axe testing passes for the guest accessibility preference form. Tests confirm labelled controls, keyboard activation, a live save status and storage limited to presentation preferences. Public/admin/report pages use native headings, lists, descriptions and captioned tables; no chart is used without a text/table alternative.

Before integration approval, test `/regions`, every admin queue, partner portal, translation/Easy Read views, `/offline-help`, offline settings, notification settings, commissioner/service-gap reports, funder pack and cost model with:

- keyboard-only navigation and visible focus;
- NVDA plus Firefox and VoiceOver plus Safari;
- 200% and 400% zoom, narrow mobile reflow and landscape orientation;
- Windows High Contrast and browser forced-colour modes;
- reduced motion and reduced visual density;
- voice control by visible label;
- table navigation with captions and row/column headers;
- plain-language/Easy Read selection, RTL direction, captions/transcripts and written emergency alternatives;
- shared-device/session preference clearing and low-bandwidth behavior.

PWA install prompts, push notifications, BSL streaming and live translations are disabled, so their human testing remains gated rather than recorded as passed. Placeholders must never be reported as accessible production content.
