# ADR-0002: Replicate, back up to PowerProtect DD, and add an immutable Cyber Recovery vault

Status: **Proposed (hypothetical).** This is a proposed approach to protection. It is **not** a public statement about McLaren's design: publicly, only "built-in protection and replication" is mentioned and no protection product is named [S3]. Date: 2026-10-23.

**Summary (Y-statement):** In the context of tier-1 data with an assumed RPO of 15 minutes and RTO of 4 hours, facing ransomware risk and tight turnarounds between races, we would decide for native replication plus PowerProtect DD backup plus an immutable, air-gapped Cyber Recovery vault, and neglect replication alone, to get recoverable clean copies, accepting extra cost and an isolated environment to run.

## Context and drivers
- Assumed targets for tier-1 data: RPO 15 min, RTO 4 h (R4).
- Back-to-back races leave little time to recover.
- Design IP must stay on site (R2, C2).

## Decision criteria
RPO and RTO, ransomware resilience (immutable, isolated copies), data residency, cost and operational weight.

## Considered options
| Option | Pros | Cons |
|---|---|---|
| A. Replication only (PowerStore native sync/async [S12], PowerScale SyncIQ [S13]) | Fast failover; built in | A live replica can also carry unwanted changes; no isolated clean copy |
| B. A plus backup to PowerProtect DD | Point-in-time recovery | Backup copies can still sit on the production network |
| **C. B plus Cyber Recovery vault on-premises** | Air-gapped, immutable retention-locked copies and analytics [S15]; keeps data on site | Extra infrastructure and process |
| D. B plus vault deployed in Google Cloud | Dell documents GCP as a vault location [S15]; second location | Moves data off site; only acceptable for class 3 derived data, not design IP |

## Decision
Option C for tier-1 and design-IP data. Option D only if a second location is needed for derived analytics data (class 3).

**Analogy:** spare parts in the truck (backup) plus a locked vault in the factory (immutable copy). If the truck is compromised, the vault is not.

## Consequences
- Positive: a clean, immutable recovery point; residency respected.
- Negative: more to build and test; the vault is connected only during synchronization by design [S15], so recovery drills must be planned.
- The targets in R4 are assumptions; the restore test decides whether 4 h is real.

## Confidence and revisit
- Confidence: **low-medium** (a proposal built on Dell's documented capabilities, not on McLaren's design).
- Revisit when the customer states its existing backup product, or when the restore test misses the RTO.

## How this would be validated
Ask what backup and replication exist today; run a restore drill on a representative dataset against the 4 h RTO; confirm retention lock mode with the security team.

## Open questions
Which workloads count as tier-1? Who holds the vault's security-officer role? (Dell's hardening guide expects a separate security officer for retention-lock compliance mode [S15].)
