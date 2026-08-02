# Internal portable case format v1

`navigator-internal-portable-case-v1` is an internal interoperability format, not a national standard.

The JSON package contains a manifest, sensitivity category, controlled dataset revision, export date, evidence index, document list, consent summary, timeline, deadlines, stable service/council references and a SHA-256 checksum. Evidence files are excluded unless the user separately selects them and an approved safe-delivery path exists. A human-readable accessible PDF may accompany JSON but does not replace it.

Exports inherit existing owner/consent authorization, audit, encryption, retention and revocation controls. Consumers must reject unknown format versions, validate every field, verify the checksum and avoid logging content.
