# ADR-0003: Subscribe through APEX with committed plus buffer capacity instead of buying for peak

Status: Accepted as an analysis of public information. Date: 2026-10-23.

**Summary (Y-statement):** In the context of storage demand that grows with every race and spikes around events, facing the risk of over-buying or running short, we decided for a subscription with a committed baseline plus pre-deployed buffer capacity (Dell APEX Infrastructure), and neglected buying capacity sized for peak, to align spend with usage, accepting a term commitment and metering.

## Context and drivers
- McLaren publicly subscribes to its Dell storage through APEX Infrastructure [S3]. This ADR explains why that logic fits; it says nothing about McLaren's actual contract or prices.
- Demand grows steadily (A3, A8) and spikes with the race calendar (A2).
- The team works under a cost cap [S9]; how it treats subscription versus purchase is not verified here.

## Decision criteria
Demand variability, capacity growth, cash-flow and cost-cap treatment, eligibility of the products, and speed of adding capacity.

## Considered options
| Option | Pros | Cons |
|---|---|---|
| A. Buy for peak (capex) | Ownership; no usage metering | Idle capacity between peaks; growth needs new procurement |
| **B. APEX: committed plus buffer** | Buffer capacity is installed up front and billed when used; the 85% billing cap on installed capacity is available for storage, data protection, and VxRail [S14] | Term commitment; metering required; **the cap excludes servers**; dark sites and non-metered deployments are not eligible [S14] |
| C. Public-cloud storage only | Elastic | Design IP stays on site (R2); egress and latency |

## Decision
Option B for storage and data protection, sized with the capacity range from the calculator: commit near the **low** scenario, hold buffer for the **base to high** scenarios.

**Analogy:** spare cars already in the garage. They are there when you need them, and you pay only for the ones you actually race.

## Consequences
- Positive: spend follows usage; capacity can be added quickly from the installed buffer [S14].
- Negative: a commitment; servers (PowerEdge) are outside the 85% cap [S14]; the isolated Cyber Recovery vault may be hard to meter, so its eligibility must be checked (open question).
- Prices and commit levels are not public, so this repo states **no costs** for APEX.

## Confidence and revisit
- Confidence: **medium** (Dell's terms are published; the customer's terms are not).
- Revisit when measured growth differs from the placeholder range, or when eligibility excludes a key system.

## How this would be validated
Take measured capacity and growth (Live Optics [S18]), build low, base, and high demand curves, and compare commitments with a Dell quote. Confirm eligibility of each system with the Dell commercial team.
