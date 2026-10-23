# ADR-0004: Send derived analytics data only to GCP over HA VPN

Status: Proposed (hypothetical). Only the use of Google Cloud, BigQuery, and Looker is public [S6]. That only derived data crosses, and that it travels over HA VPN, is this analysis's own design, not something McLaren or Dell has published. Date: 2026-10-23.

**Summary (Y-statement):** In the context of a team that uses BigQuery and Looker for race data and keeps design IP on site, facing a post-race volume of about 46 Mbps on average, we decided to send only derived analytics data to GCP over HA VPN, and neglected moving raw data, tiering raw files with CloudPools, or buying a private Interconnect, to respect data residency at the lowest complexity, accepting internet-path latency for batch loads.

## Context and drivers
- Google Cloud is McLaren's cloud partner, and BigQuery and Looker are used for race data [S6].
- Design IP is confidential [S8]; aero and CFD are regulated [S9].
- Volumes: 1.5 TB per weekend, 34.5 TB per year, 46.3 Mbps average, 0.833 Gbps in a 4 h window (A1, A3 to A5).

## Decision criteria
Residency, volume versus link capacity, availability target, cost, and operational weight.

## Considered options
| Option | Pros | Cons |
|---|---|---|
| A. Move raw data to GCP | Simple analytics | Breaks the IP and CFD constraints |
| B. Tier Dell storage to Google Cloud (PowerScale CloudPools [S13], or the PowerScale-based Google Cloud file service [S16], **verify availability**; PowerScale for Public Cloud lists AWS and Azure, not Google Cloud [S17]) | Dell-native path for inactive file data | Moves file data off site; not for design IP |
| **C. Derived data only, over HA VPN** | Meets residency; 0.833 Gbps fits one tunnel of roughly 1 to 3 Gbps [S19]; no new physical dependency | Latency varies; needs a redundant VPN device for the 99.99% design |
| D. Private Interconnect | Deterministic latency, high capacity [S20] | Not justified at this volume; colocation or provider needed |

## Decision
Option C. Class-3 derived data (summaries, strategy outputs, fan-facing data) crosses the link; classes 1 and 2 never do (ADR-0001).

**Analogy:** the setup sheet stays in the garage; only the race summary goes on the pit-wall screen.
## Consequences
- Positive: residency met by design; low start cost (gateway about $87.60 per month in London for two tunnels, A13).
- Negative: a single VPN device at the MTC would void the 99.99% design; one tunnel down in the 1 Gbps case runs near 83% use (tight).
- The Google-side network build (VPC layout, Terraform) is out of scope for this analysis.

## Confidence and revisit
- Confidence: **medium-high** on the link sizing (simple arithmetic from a public volume), **medium** on what counts as derived data.
- Revisit when sustained use passes about 50% of tunnel capacity, latency must be deterministic, or the data classification changes.

## How this would be validated
Throughput test at the 4 h burst rate, a one-tunnel-down failover test, and a dry-run publish confirming only allow-listed datasets arrive in GCP.
