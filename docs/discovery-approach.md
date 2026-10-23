# Discovery approach

Date: 2026-10-23. Source IDs point to [`sources.md`](sources.md). This is a plan for a customer like the one in the public story, not a record of real conversations.

## 1. Discovery steps
**Goal:** replace the assumptions (solution-design section 7) with measured facts, and agree the proof path before proposing anything.

| Step | Activity | Output |
|---|---|---|
| 1. Context | Confirm business drivers, the calendar, the cost-cap rules, and what already exists (a team already on Dell and Google Cloud may have much of this in place) | Driver list, constraints, current estate |
| 2. Inventory | Run **Live Optics** [S18] on servers and virtualization, storage (including a PowerStore array profile if one exists), file systems, and backup | Measured capacity, growth, file types, backup footprint |
| 3. Classify | Walk the data classes (ADR-0001) with engineering and security | Agreed class table and owners |
| 4. Recovery | Ask what must come back, how fast, and what exists today | Tiered RPO and RTO |
| 5. Commercial | Ask how subscription versus purchase is treated under the cost cap | Consumption constraints |
| 6. Summary | One page: quantified pains, stakeholder map, current state, agreed next step | Discovery summary |

## 2. Questions by decision
| Decision | Questions |
|---|---|
| Placement (ADR-0001) | Which applications need block versus file or object? What protocols? How fast is the archive growing? Which data feeds AI and analytics? |
| Protection (ADR-0002) | What backup and replication exist today? Which workloads are tier-1? Has a restore ever been timed? Who would hold the vault's security-officer role? |
| Consumption (ADR-0003) | How variable is demand across the calendar? Are there air-gapped or non-metered segments (which affect APEX eligibility [S14])? How does the cost cap treat subscription spend? |
| Compute and AI (ADR-0005) | Which workloads are training, fine-tuning, inference, or analytics? Which models, and how many users or jobs at once? Where does the input data live and how large is it? Does any workload span several servers and need a GPU fabric? What power and cooling headroom exists? |
| Cloud and link (ADR-0004) | Which datasets may leave the site? How much goes to the cloud after each event, and how fresh must it be? What VPN device sits at the site, and does it support BGP and redundancy? |
