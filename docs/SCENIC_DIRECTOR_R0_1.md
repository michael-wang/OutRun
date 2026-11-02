# Scenic Director R0.1 — Driving Intensity (observation only)

## Purpose
Correct R0's permissive feature detection and attach an explainable, immutable
**Driving Intensity 1–10** score to each detected route feature. This milestone
does **not** edit trip placements, road geometry, streaming, steering, scenery,
traffic or `contentFingerprint`. Road Composer R1 may consume the analysis later.

## Physical reference
- Same signed `pilotSample().demand` as the driven track, sampled every 20 m.
- At the existing 230 km/h indicated speed, `requiredSteering(curvature, speed)`
  converts road curvature into the actual arcade steering input needed.
- The default 1.75× high-speed pace makes travel ~112 m/s. Thus 5s is ~559m
  (the previous 260m threshold corresponded to only ~2.3s).
- `durationSeconds` is a *reference-speed estimate*, not a claim about the
  driver's actual speed, braking or lap time.

## Detection
- Straight: at most 0.085 demand over 350m.
- Continuous curve: same-direction turn, allowing at most 40m of shallow
  troughs, **at least 5s**, >=30° heading change, peak steering >=0.35 and
  sustained average >=0.25. Sharp short curves are not mislabeled long.
- S-bends: at least **two** successive, genuinely forceful opposite turns.
  Each requires >=100m, >=20°, peak steering >=0.75 and average >=0.45;
  gap <=90m. A weak turn breaks the group, rather than being silently skipped.
- U-turn: >=145° of same-direction heading change **and** peak steering >=0.85.
  A broad, leisurely arc is not automatically a hairpin.
- Merge / exit: unchanged, still only the single actual 4→5→4 interchange.

## Intensity formula
For all six types, using reference speed metrics:
`round(clamp(1 + 2.5 × peakSteer + 1.1 × meanSteer
 + 0.012 × min(totalAbsoluteDegrees, 200) + 1.15 × reversals
 + 1.2 × min(durationSeconds / 10, 1) × meanSteer, 1, 10))`

Reversal counting ignores insignificant jitter; the absolute angle integral
does not cancel left and right. The score is not forced into a range according
to category: e.g. a very demanding long curve *may* score 6 or more, while
a feature inventory *may* contain no 8–10 entries. This is an analytic
calibration, not a validated driver enjoyment metric.

## QA and acceptance
Use `?qa=1&seed=1` and open Scene Inspector → 道路特徵.
Each entry shows intensity, span, duration, peak/mean steering, cumulative
angle, number of genuine reversals, and whether steering exceeds 100% at
reference speed. A category with zero matches remains disabled; no sample
features are invented. Scores are precomputed exactly once by
`generateTrip()` for the current revision, frozen with route metadata.

Tests cover soft-versus-sharp alternations, >=5s curve classification,
wide-versus-tight U-turn, stable seed outputs, immutable scores and
unchanged interchange/route identities. Browser UI smoke additionally
checks the visible analysis fields.
