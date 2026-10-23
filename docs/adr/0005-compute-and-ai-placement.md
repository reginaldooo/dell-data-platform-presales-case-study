# ADR-0005: Size AI compute by workload class, inference first, training only when justified

Status: **Proposed (hypothetical).** Publicly, McLaren and Dell say only that the team uses the Dell AI Factory, including PowerEdge servers, to process about 1.5 TB per race weekend for simulation, digital-twin modelling, and scenario planning [S2]. No server model, GPU type, or count is published. The approach below is reasoning from Dell's own guidance, not a description of McLaren's environment. Date: 2026-10-23.

**Summary (Y-statement):** In the context of a team that turns race-weekend data into simulations and digital-twin scenarios, facing uncertainty about how much of the AI work is training and how much is inference, we would decide to size compute by workload class, starting with inference-class PowerEdge servers and keeping models and data on PowerScale, and neglect buying one large training-class system for everything, to avoid paying for idle GPU capacity, accepting that a later training need may require a second step.

## Context and drivers
- Public: the Dell AI Factory with PowerEdge servers handles 1.5 TB per race weekend for rapid simulation, digital-twin modelling, and real-time scenario planning [S2].
- Dell positions different PowerEdge classes for different AI work: an 8-GPU flagship for training and fine-tuning, 2U GPU servers for light inferencing and general generative AI, and inference-focused systems for demanding enterprise inferencing [S26]. Model names change often, so they must be re-checked before use.
- Dell's design guidance: the number of GPU servers depends on the number of models and the number of concurrent requests [S27].
- Aero and CFD work is regulated, and the rules cover AI based on simulation results [S9], so this ADR covers race-operations analytics and digital-twin scenario work only.

## Decision criteria
Workload type (training, fine-tuning, inference, analytics), concurrency, data location and size, network needs, power and cooling headroom, and the cost of idle capacity.

## Considered options
| Option | Pros | Cons |
|---|---|---|
| A. CPU-only servers | Lowest cost and complexity | Weak for model inference and scenario simulation at speed |
| B. One large training-class system for everything | Headroom for any model; one platform | Highest cost; likely idle between events; heavier power, cooling, and fabric needs [S26] |
| **C. Size by workload class** | Pay for what the workloads need; inference classes are lighter; a clear path to add training capacity later [S26] [S27] | Needs workload profiling first; two classes of server to manage if training is added |
| D. Rent GPUs in the cloud | Elastic | Design IP and regulated data stay on site (R2, C2); out of scope for this analysis |

## Decision
Option C. Start from a measured workload inventory (models, concurrency, data sources). Place inference and analytics on inference-class PowerEdge servers, with models and data on PowerScale as the shared store [S27]. Add a training-class system only after profiling shows sustained training or fine-tuning demand. No server or GPU counts are stated, because they depend on the models and concurrency [S27].

**Analogy:** the pit crew versus the machine shop. The pit crew does many small, fast jobs at the right moment. The machine shop does one big, long job. You do not buy the machine shop to change tyres.

## Consequences
- Positive: spend follows the actual workload; the storage platform in ADR-0001 doubles as the model and data store.
- Negative: storage and network needs change with the workload. Inference mostly reads models once, while training adds checkpoint traffic and, across several servers, needs a GPU fabric [S27]. Power and cooling must be checked before any GPU purchase.
- Compute is still outside the APEX billing cap, which excludes servers [S14] (ADR-0003).

## Confidence and revisit
- Confidence: **low-medium** (Dell's guidance is published; the customer's workloads are unknown).
- Revisit when profiling shows sustained training, high concurrency, or models that no longer fit one server.

## How this would be validated
Run Live Optics on the server estate [S18] and add a model and concurrency inventory: which models, how many users or jobs at once, how large the data is, and where it lives. Then test one representative workload on an inference-class system before sizing anything larger.
