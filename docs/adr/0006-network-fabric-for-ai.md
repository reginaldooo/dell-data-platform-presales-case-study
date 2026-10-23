# ADR-0006: Keep the site network for storage and analytics, add a dedicated Ethernet GPU fabric only when AI work spans several servers

Status: **Proposed (hypothetical).** Publicly, only the trackside side is described: Dell servers, Cisco switching, and a dedicated 100 Mbps MPLS link to the MTC [S5]. No switch, topology, or link speed inside the MTC is published. The approach below is reasoning from Dell's own guidance, not a description of McLaren's network. It extends ADR-0005 and does not change it. Date: 2026-10-23.

**Summary (Y-statement):** In the context of a team that may run AI work across more than one GPU server, facing uncertainty about whether that work needs GPU-to-GPU traffic, we would decide to keep the existing site network for storage and analytics and add a separate lossless Ethernet fabric (RoCEv2) only when profiling shows multi-server GPU jobs, and neglect building a dedicated AI fabric up front, to avoid paying for network capacity that single-server inference never uses, accepting that a later fabric means a second network to run.

## Context and drivers
- ADR-0005 starts with inference-class servers. Dell's guidance says multi-server work needs a GPU fabric, while inference on one server mostly reads models once [S27].
- Dell describes lossless Ethernet with RoCEv2 and Enterprise SONiC as the fabric for its AI Factory, managed with open tools or SmartFabric Manager [S28].
- Dell lists PowerSwitch models for AI fabrics at 400 and 800 GbE, all with RoCEv2 support [S29]. Model names change often and must be re-checked before use.

## Decision criteria
Whether jobs span several servers, traffic between GPUs versus traffic to storage, headroom on the existing switches, operating skills (a second fabric to manage), and cost.

## Considered options
| Option | Pros | Cons |
|---|---|---|
| A. One shared network for everything | Simplest; nothing new to run | Storage and GPU traffic compete; poor fit once jobs span servers [S27] |
| B. Dedicated AI fabric from day one | Ready for large jobs | Highest cost; idle if work stays single-server |
| C. InfiniBand fabric | A common choice for large GPU clusters | A second technology to operate; not evaluated further here |
| **D. Staged: shared network first, Ethernet RoCEv2 fabric when needed** | Spend follows the workload; same Ethernet skills; clear trigger [S28] | A second network appears later; needs workload profiling first |

## Decision
Option D. Keep storage, analytics, and single-server inference on the existing network. Add a separate Ethernet fabric for GPU traffic only when ADR-0005 profiling shows jobs that span several servers. Port counts, speeds, and topology are not stated, because they depend on that profiling [S27]. Enterprise SONiC and SmartFabric Manager are Dell options to validate, not a requirement [S28].

**Analogy:** the main road versus the pit lane. Everyday traffic uses the main road. When many cars must move in lockstep, you close off a pit lane for them instead of widening the whole road.

## Consequences
- Positive: no network spend before there is a multi-server need; the storage design in ADR-0001 is unaffected.
- Negative: two networks to operate once the fabric exists; a lossless setup needs careful configuration and testing [S28].
- Outside the APEX billing cap, like servers [S14] (ADR-0003); check the commercial treatment when the time comes.

## Confidence and revisit
- Confidence: **low** (Dell's guidance is published; the customer's network and workloads are unknown).
- Revisit when ADR-0005 profiling shows sustained multi-server training or high concurrency, or when the existing switches lack ports or speed.

## How this would be validated
Inventory the existing switches (model, speeds, free ports) during discovery, using the network questions in [`discovery-approach.md`](../discovery-approach.md). Then test one multi-GPU job on the current network and measure whether GPU-to-GPU traffic is the bottleneck before proposing a fabric.
