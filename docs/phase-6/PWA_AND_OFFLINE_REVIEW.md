# PWA and offline privacy review

Phase 6 supplies a static low-bandwidth `/offline-help` page and a public-pack allowlist. It does not register a service worker, expose an install prompt, start background sync or request push permission. `pwa_installation` and `push_notifications` are false.

Private profiles, sessions, cases, timelines, consent, evidence, documents and advocate details are prohibited from public packs and cacheable paths. Guest accessibility preferences use `sessionStorage` only, are validated as untrusted presentation settings, and contain no authentication or case data. Installation is never required.

Before `PWA-001` can close, independently inspect generated cache manifests, expiry/invalidation, shared-device behavior, neutral/discreet naming and icons, storage clearing, offline response headers and lock-screen previews. Written emergency content must remain available without media.
