# Phase 6 accessibility integration review

Phase 6 adds diagnosis-free presentation preferences for text size, line spacing, contrast, reduced motion, simplified layout, plain language, Easy Read, BSL, captions, screen-reader optimization, keyboard-first use, voice input, low bandwidth and reduced visual density. Guest preferences use tab-scoped `sessionStorage`; no case, token or diagnosis data is stored, and explicit sharing allowlists are required.

Automated axe coverage for the preference form passes, as do keyboard save behavior and Phase 5 administrative accessibility tests. Alternative-content models bind translations, Easy Read and media assets to versioned source content and prevent automatic high-risk publication.

Manual testing remains required for screen readers, voice control, 400% zoom/reflow, high contrast, reduced motion, mobile navigation, shared/public devices, BSL media quality and translated emergency/legal content. `TRANSLATION-001`, `OFFLINE-001`, `PWA-001` and the earlier accessibility gates remain open.
