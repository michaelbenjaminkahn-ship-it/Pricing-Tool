# Steel Pricing

Landed-cost and quote workspace for imported stainless steel plate.

Live app: https://michaelbenjaminkahn-ship-it.github.io/Pricing-Tool/

## How it works

- **Deals are the unit of work.** A deal is one supplier→customer lane with shared
  freight, duties, finance, and handling — and one or more sizes priced side by side
  (mirroring the original Excel deal sheets). Open a deal, change the FOB price or
  freight, everything recalculates instantly.
- **Every number is auditable.** The cost breakdown shows the formula for each line
  (e.g. `50% × $2,260 FOB`), so any figure can be checked at a glance.
- **Share links.** "Share link" encodes the whole deal into a URL — a colleague who
  opens it gets the exact deal in their own workspace. No backend, no accounts.
- **Global defaults** (Rates & defaults) seed new deals. Existing deals keep their
  own snapshot until you explicitly apply defaults inside the deal, so saved quotes
  never shift silently.

## Accuracy

The calculation engine (`src/engine/calc.ts`) was reconciled cell-by-cell against the
real pricing workbooks, and `src/engine/calc.test.ts` locks it to their exact outputs:

| Workbook | Deal | Verified values |
|---|---|---|
| alro.xlsx | Yuen Chang → Alro (CIF LA) | landed $3,488.23/MT · $1.5822/lb · sale $1.646 |
| sammyla50pct.xlsx | Yuen Chang → Samuel (CIF LA) | landed $3,172.02/MT · $1.4388/lb · sale $1.583 |
| alro__camden_bulk.xlsx | Yeou Yih → Alro (bulk, 3 sizes) | landed $3,558.93 / $3,682.31 / $3,855.64/MT · total margin $10,609.69 |

Conventions proven by those workbooks (and enforced by the tests):

- Section 232 / HMF / MPF are computed on the **contract FOB** (customs basis),
  not the weight-gain-adjusted FOB. Weight gain adjusts the material cost line only.
- Marine insurance applies to FOB deals only (a CIF price already includes it).
- Credit insurance is computed on the CFR value (contract + freight).
- LC finance and commission are computed on the **contract price** (CIF for CIF
  deals, FOB for FOB deals). A per-deal toggle supports the CFR basis instead.
- Tariff finance = tariff amount × %financed × rate × days/360 (default 100% financed).
- Sale from markup = landed × (1 + markup%), rounded to 0.001; GP% is reported on sale.

CI runs the test suite before every deploy — a change that breaks agreement with the
workbooks cannot ship.

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # calculation tests (locked to the source workbooks)
npm run build    # type-check + production build
```

Deployed to GitHub Pages automatically on push to `main`
(`.github/workflows/deploy.yml`).
