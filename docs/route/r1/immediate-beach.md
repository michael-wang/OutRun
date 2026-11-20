# R1b · Immediate Kenting arrival (Julia implementation candidate)

**Status: SOURCE-EDITED / LOCAL BUILD AND DRIVING UNVERIFIED.** This is a separate, reversible candidate on `review/kenting-r1-julia`, not a migration of `dev` or `main`. R1's original +650 m relocatability stress test remains intact.

## Why a zero-length entry Connector is the right answer here

The approved reference coast *already contains* the required arrival composition. The final A6 drift is at track 4000–4350 m; Kenting's natural inland mountain starts influencing the road at about 3950 m and grows through the end of A6. The existing large right-hand bend follows around track 4635–4785 m, first beach gathering at 4738 m and the protected beach core at 4850 m. The player sees the mountain before the lesson finishes, takes the big right-hand bend, and sees the bay without a 650 m separate approach.

R1's `relocated` installation shifted the entire core from 4850 to 5500, adding a 650 m entry connector. Keeping that displacement to demonstrate module portability is valuable, but it should not govern the **final gameplay pacing**. Where two existing road ports already meet, no connector should be generated. Do not force an adapter to justify an architecture.

The `immediate` layout uses the identical original road geometry and scene-local coordinates at coreStart 4850, while deferring the unfinished Working Harbour and Coastal Woods hero markers and their specific source scenery. This is a **scene-order/ownership test** and a candidate for the owner-approved early holiday reveal, *not* a second proof of non-zero translation.

## Run the three comparisons (separate process / restart required)

The installation is selected at Vite startup, **not** by a browser query. Be sure to stop the earlier server, then from a clean local checkout of the review branch:

```powershell
$env:VITE_KENTING_INSTALLATION = 'immediate'
npm run dev -- --host 0.0.0.0 --port 5234 --strictPort
# http://127.0.0.1:5234/?at=4000   — second drift, hill, right turn, beach
```

Other configurations:
- `original`: approved R0 layout with legacy harbour/woods content, for visual comparison.
- `relocated`: Judy's +650 m R1 stress-test layout, for port/connector regression.
- `immediate`: proposed stage order (no added entry connector; harbour/woods deferred).

The default without `VITE_KENTING_INSTALLATION` remains `original` to protect existing consumers; select `immediate` explicitly for evaluation.

## Source changes and validation boundaries

- `kenting-installation.json` has the third installation. Runtime now distinguishes a **candidate with deferred neighbours** (`relocated`) from one that **actually translates geometry** (`shifted`). `delta=0` returns the native road unchanged; attempting a zero-length Hermite connector would be incorrect.
- The original coastline and farm binaries are reused in `immediate`, because the physical geometry is unchanged; `relocated` still has its own shore and farm cache.
- The HUD labels the beach from track 4350 m; it does not invent an entrance Connector. The existing continued cape coast past track 6800 is labelled `海岬沿岸`, not falsely presented as newly generated geometry.
- The independent Sail Bay boats are no longer accidentally filtered by the shifted beach's reference-space mask.
- New targeted unit tests cover native route identity, A6 mountain, high-curvature right-hand bend, shore cache and independent boats.

**Do not claim the tests passed remotely.** Run `npm run verify:dev`, the targeted Vitest tests, Playwright / Chrome full drive, and Pixel 8 visual/FPS checks locally. Review A6 hill concealment, right turn, first parasol visibility, beach and cape, real traffic/AI, collision walls and shore seams. Existing 650 m relocation's lost breakdown pair remains a known stress-test gameplay difference; the `immediate` native road is intended to preserve ordinary event eligibility, but requires a seed replay to confirm.

## R2 handoff

Do not move unfinished harbour or windbreak trees into the immediate beach footprint. R2 first creates explicit source ownership and authoring ports, then after owner review constructs their independent roads and connections. The order is **Tutorial → Kenting Beach → Working Harbour → Coastal Woods**; actual distances after Kenting, the old pressure-gate transitions and total stage length are intentionally uncommitted.
