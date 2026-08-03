# ADR 0004: Translation versioning

## Context
Translations can become unsafe when source content changes.
## Decision
Bind translations and Easy Read/media derivatives to immutable source versions; invalidate outdated derivatives and block critical publication. High-risk translations require human legal and safeguarding review.
## Alternatives
Overwriting current text and automatic high-risk publication were rejected.
## Consequences
Source edits create explicit review work.
## Security impact
Stored text is rendered as text, not injected markup.
## Privacy impact
Content versions contain public operational content only.
## Accessibility impact
RTL metadata, transcripts, captions and written alternatives are first-class.
## Migration impact
Adds version and dependency tables.
## Reversal strategy
Keep the last approved source version public while derivatives are withdrawn.
