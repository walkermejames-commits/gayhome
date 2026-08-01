# Controlled source datasets

These files are byte-for-byte copies of the supplied authoritative inputs. Do not edit them in place.

| File | Role | SHA-256 |
|---|---|---|
| `kent_lgbtq_homelessness_resource_seed.json` | Canonical initial runtime seed | `D41B7056CBA08EDC8951C5360F33054CD0FF3A9FBDCAE4F0425BA0889A155311` |
| `Kent_LGBTQ_Homelessness_Resource_Database_v1.xlsx` | Controlled editorial, bulk-review and QA source | `B8F921BB33F326CB167A55EBAA32A8621DE4D5F94C166ABDA955E182E35BB54F` |

Import policy:

1. Hash the file and create an immutable import record.
2. Parse into staging tables without publishing.
3. Validate schema, stable IDs, references and safety invariants.
4. Reconcile against the active revision.
5. Require authorised approval for conflicts and safety-critical changes.
6. Publish a new immutable dataset revision; never mutate a published revision.

The originals supplied in `C:\Users\imedt\Downloads` were not modified.
