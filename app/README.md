# Calculators

Two small calculators in one static page (no build step). Both reuse the math in `sizing.js`, covered by `tests/sizing.test.js` (15 tests).

1. **Capacity range:** low, base, and high usable capacity from placeholder assumptions (10 years, 10% growth, 25% protection overhead, 20% headroom, no data reduction, 20% buffer). These are **illustrative defaults, not a Dell sizing and not McLaren's capacity**.
2. **Link sizing:** how much of an HA VPN tunnel a race weekend of data uses, including the one-tunnel-down case. Defaults: 1,500 GB per weekend, a 4 h copy window, a 72 h weekend, 23 races, 1 Gbps tunnels, 2 tunnels. That gives 46.3 Mbps on average, 0.833 Gbps in the window, 34.5 TB per year, and 83.3% use with one tunnel down.

## Run and test
```bash
cd app && python3 -m http.server 8765   # open http://localhost:8765
npm test                                # from the repo root; runs node --test
```

The page is static and can be hosted from this folder as-is.

## Design
Follows the portfolio design system: Saira Condensed and Barlow, hard edges, neutral canvas, spec rows for results. Status colors always come with text.
