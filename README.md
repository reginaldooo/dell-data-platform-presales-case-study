# 🏁 Dell Data Platform for an F1 Team: A Presales Analysis of a Public Story

[![GitHub](https://img.shields.io/badge/GitHub-reginaldooo-181717?logo=github&style=flat-square)](https://github.com/reginaldooo)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-farrel--reginaldo-0A66C2?logo=linkedin&style=flat-square)](https://linkedin.com/in/farrel-reginaldo)
[![Live calculators](https://img.shields.io/badge/Live%20calculators-Vercel-000000?logo=vercel&style=flat-square)](https://dell-data-platform-presales-case-st.vercel.app/)
[![CI](https://img.shields.io/github/actions/workflow/status/reginaldooo/dell-data-platform-presales-case-study/ci.yml?branch=main&label=CI&style=flat-square)](https://github.com/reginaldooo/dell-data-platform-presales-case-study/actions/workflows/ci.yml)
[![Sources](https://img.shields.io/badge/Sources-public%20information%20only-informational?style=flat-square)](docs/sources.md)
[![Affiliation](https://img.shields.io/badge/Affiliation-none-lightgrey?style=flat-square)](docs/solution-design.md#10-not-covered-and-notices)

> **"How would a presales architect reason about the data platform behind an F1 team, using only what is public?"**

> ⚠️ **Analysis of public information. Not a proposal, and no inside knowledge.** This study uses only what Dell and McLaren Racing have published about their partnership. It has not seen McLaren's environment, and the real design is probably different. Anything beyond public facts is labelled **hypothetical** (🧪). Nothing was deployed.

## 📖 Situation
McLaren Racing has been a Dell partner since 2018 [S1]. Publicly, the team produces about 1.5 TB of data per race weekend across 23 Grands Prix in 2026 [S2] [S7]. That data runs on Dell PowerEdge servers, with PowerStore for latency-sensitive work and PowerScale for telemetry archives, video, and history [S2] [S3]. Storage is consumed through Dell APEX Infrastructure [S3]. Google Cloud is the team's Official Cloud partner, with BigQuery and Looker used for race data [S6].

Not public: how data is protected, how it moves to Google Cloud, which servers and GPUs are used, and any capacity or contract figure. This study treats those as open questions.

## 🎯 Task
Explain why a team with this profile would choose these Dell products, and list what a presales architect would validate before recommending anything. The result is an analysis of a public story, not advice to the customer.

## 🛠️ Action
1. **Classified the data** by access pattern, speed, and sensitivity, because the product choice follows the data class.
2. **Wrote five decision records (ADRs)**, each with options, pros and cons, confidence, revisit triggers, and one analogy for non-technical readers.
3. **Kept every number in one assumptions register**, tagged Public, Calculated, or Assumed, and stated as ranges where a value is a guess.
4. **Built two small calculators** that reproduce those numbers: a capacity range and a link-sizing check.

```mermaid
flowchart LR
  A["Classify the data<br/>who may see it, how fast, how big"] --> B["Place it<br/>PowerStore or PowerScale<br/>ADR-0001"]
  B --> F["Size the compute<br/>inference first, training if justified<br/>ADR-0005 (hypothetical)"]
  F --> C["Protect it<br/>replicate, back up, vault<br/>ADR-0002 (hypothetical)"]
  C --> D["Pay for it<br/>committed plus buffer<br/>ADR-0003"]
  D --> E["Send only derived data to the cloud<br/>ADR-0004 (hypothetical)"]
```

High-level design (products as publicly described; the protection layer and the cloud link are hypothetical):

```mermaid
flowchart LR
  subgraph TRACK["Trackside (existing, out of scope)"]
    VX["Dell VxRail IT tower<br/>telemetry and VMs"]
  end
  subgraph MTC["McLaren Technology Centre (Dell on-premises)"]
    PE["PowerEdge<br/>AI Factory compute (ADR-0005)"]
    PS["PowerStore<br/>latency-sensitive data"]
    PSC["PowerScale<br/>telemetry archive, video, history"]
    PP["PowerProtect DD + Cyber Recovery vault<br/>(hypothetical)"]
    APEX["APEX Infrastructure<br/>subscription for storage"]
  end
  subgraph GCP["Google Cloud"]
    BQ["BigQuery + Looker<br/>derived analytics data"]
  end
  VX -. "existing link" .-> PE
  PE --- PS
  PE --- PSC
  PS --> PP
  PSC --> PP
  PS --- APEX
  PSC --- APEX
  PSC == "derived data only (ADR-0004)" ==> BQ
  style TRACK fill:#eeeeee,stroke:#999999
```

| ADR | Decision | Analogy | Basis |
|---|---|---|---|
| [0001](docs/adr/0001-data-placement-powerstore-vs-powerscale.md) | Place data by class: PowerStore for latency-sensitive work, PowerScale for large unstructured data [S10] [S11] | The race engineer's laptop (small, fast, now) versus the archive room (huge, organized) | 🟢 |
| [0002](docs/adr/0002-data-protection-and-cyber-recovery.md) | Replicate, back up to PowerProtect DD, add an immutable Cyber Recovery vault [S15] | Spare parts in the truck plus a locked vault in the factory | 🧪 |
| [0003](docs/adr/0003-consumption-model-apex-vs-purchase.md) | Subscribe through APEX: committed baseline plus buffer, instead of buying for peak [S14] | Spare cars already in the garage; pay only for the ones raced | 🟢 |
| [0004](docs/adr/0004-cloud-analytics-and-connectivity.md) | Send derived data only to Google Cloud over HA VPN [S19] | The setup sheet stays in the garage; only the race summary goes on the pit-wall screen | 🧪 |
| [0005](docs/adr/0005-compute-and-ai-placement.md) | Size AI compute by workload class: inference-class PowerEdge first, training only when justified [S26] [S27] | The pit crew (many small, fast jobs) versus the machine shop (one big, long job) | 🧪 |

🟢 reasoning from public facts · 🧪 hypothetical, not published by Dell or McLaren

## ✅ Result

### 📊 Key takeaways
1. **The product choice follows the data class.** Latency-sensitive databases and analysis tools suit PowerStore, while large unstructured data suits PowerScale, which matches both McLaren's public description and Dell's own guidance [S3] [S10] [S11].
2. **One eligibility detail can change the answer.** The APEX billing cap covers storage, data protection, and VxRail, but not servers, and dark sites are not eligible [S14].
3. **The volume is small, so the link is not the hard part.** At most 34.5 TB of new data per year, 46 Mbps on average, or 0.83 Gbps if copied in a 4 h window (calculated from [S2] and [S7]; upper bounds that assume everything is kept).
4. **An availability check removed a design option.** PowerScale for Public Cloud lists AWS and Azure, not Google Cloud, so a Dell-native cloud file service on Google Cloud needs verification before it is proposed [S17].
5. **The riskiest assumptions are retention period and growth.** That is why capacity is a low, base, and high range in the calculator, to be replaced by measured data (Live Optics) and Dell sizing.

### Limits
- This is not McLaren's design, and public figures are vendor-published and may be optimistic.
- It is not a Dell sizing or a quote. Protection overhead, growth, and data reduction are placeholders, and no Dell prices are stated because none are public.
- Nothing was deployed, load-tested, or operated.
- Scope is one slice: no trackside design, AI Factory sizing, Dell networking design, aero or CFD work, or security operations.

## 🧮 Calculators
**Live: https://dell-data-platform-presales-case-st.vercel.app/**

Two small static calculators (source in [`app/`](app/)), with the math covered by 15 tests: a **capacity range** (low, base, and high usable capacity from placeholder assumptions, illustrative only) and a **link-sizing** check (share of an HA VPN tunnel used by a race weekend of data, including the one-tunnel-down case).

## 🗂️ Project structure
```
docs/
  solution-design.md   scope, public facts, requirements, design, assumptions register, risks
  adr/                 five decision records
  discovery-approach.md   how assumptions would be replaced with measured data (Live Optics)
  sources.md           every claim traced to a source and its publisher
app/                   capacity and link calculators (static page)
tests/                 unit tests for the sizing math
```

## 🚀 Run locally
```bash
cd app && python3 -m http.server 8765   # open http://localhost:8765
npm test                                # from the repo root
```

## ⚖️ Sources, attribution, and notices
All claims trace to [`docs/sources.md`](docs/sources.md). Method: ADRs follow the Nygard/MADR style and are superseded rather than edited [S22] [S23]; numbers and confidence levels follow presales practice [S24]; customer names and results appear only as already published [S25].

McLaren, Dell, and Google are trademarks of their owners. No logos are used, no affiliation is claimed, and no endorsement is implied.

*Author: Muhammad Farrel Reginaldo Ahnaf ([GitHub](https://github.com/reginaldooo), [LinkedIn](https://linkedin.com/in/farrel-reginaldo)).*
