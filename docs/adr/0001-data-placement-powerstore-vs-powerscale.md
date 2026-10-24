# ADR-0001: Place data by class, PowerStore for latency-sensitive work and PowerScale for large unstructured data

Status: Accepted as an analysis of public information. Date: 2026-10-23.

**Summary (Y-statement):** In the context of a team that creates about 1.5 TB per race weekend and keeps years of history online, facing a mix of latency-sensitive work and fast-growing unstructured data, we decided to place data by class on PowerStore and PowerScale, and neglected a single platform for everything, to get fit-for-purpose performance and scale, accepting two platforms to operate.

## Context and drivers
- About 1.5 TB per race weekend, 23 races in 2026 [S2] [S7].
- Publicly, PowerStore serves simulation runs, application databases, and analysis tools; PowerScale holds telemetry archives, video, and historical datasets that feed analytics and AI [S3].
- History is kept online, not archived cold [S3].

## Decision criteria
Access pattern and protocol, latency sensitivity, scale and growth, need to feed AI and analytics, and operational simplicity.

## Considered options
| Option | Pros | Cons |
|---|---|---|
| A. Everything on PowerStore | One platform; unified block and file with always-on data reduction [S12] | Dell positions multi-PB scale-out file on PowerScale [S11]; growth in unstructured data would pressure it |
| B. Everything on PowerScale | Scale-out file and object, parallel NFS/SMB/S3 [S10] | Not Dell's positioning for latency-sensitive databases and VM workloads [S10] |
| **C. By data class** | Each workload on the platform built for it [S10] [S11] | Two platforms, two skill sets |
| D. Cloud storage first | Elastic | Design IP is kept on site (R2); egress and latency; out of scope here |

## Decision
Option C. Placement by class:
| Class | Platform | Basis |
|---|---|---|
| Latency-sensitive databases, simulation runs, analysis tools | PowerStore | [S3] [S10] |
| Telemetry archives, video, historical datasets, CFD outputs | PowerScale | [S3] [S10] [S11] |
| Design IP and aero data | Stay on-premises | [S30] [S8] [S9]; the rules require protection, so on-site is this analysis's choice |
| Derived analytics data | May go to GCP (ADR-0004) | [S6] |

**Analogy:** the race engineer's laptop (small, fast, needed now) versus the archive room (huge, organized, always open). You do not run the archive room from a laptop, and you do not keep the live data in the archive.

## Consequences
- Positive: each workload meets its performance and scale needs; this matches Dell's own positioning and what McLaren Racing states publicly.
- Negative: two platforms to size, monitor, and protect; the boundary between classes needs an owner.

## Confidence and revisit
- Confidence: **medium-high** for the direction (public statements match Dell's positioning), **low** for exact boundaries and capacities.
- Revisit when the file workload is small enough to sit on a unified PowerStore, or when archive growth changes the capacity plan (see the calculator).

## How this would be validated
Run Live Optics on the file and storage estate to get growth, file counts, and file types, and a PowerStore array profile if one exists [S18]. Confirm which protocols each application needs.
