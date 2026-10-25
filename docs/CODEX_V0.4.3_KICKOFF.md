# Codex autonomous kickoff — v0.4.3 Soft Steering & Honest Curves

**Context:** v0.4.2 was delivered/playtested and its **core new game model received a human GO**, but four concerns remain: notch transitions too harsh, visual body yaw too timid on hard bends, small corrections visibly turn car too much, and curve pressure looks disproportionate to actual road curvature. Continue the proven model, don't start over.

## Git & workspace prep (Codex does this, not the user)

- Project path `C:\astra-dev\OutRun`, expected remote `michael-wang/OutRun`. Verify branch/status/working code. v0.4.2's latest LOCAL playable implementation `d44c8e5` and handoff `f7ed029` were reported committed; preserve later changes.
- GitHub `origin/main` remains a documentation branch; **don't merge/reset/checkout it over the playable source**. Create `codex/v0.4.3-soft-steering` from current playable local HEAD, fetch origin/main and selectively import ONLY `AGENTS.md`, `docs/V0.4.3_SPEC.md`, `docs/V0.4.3_ACCEPTANCE.md`, `docs/CODEX_V0.4.3_KICKOFF.md`. Preserve local app, README and any unexpected changes.
- The prior `stop after v0.4.2` was for human review of that milestone, now completed. If automated approval still blocks the next milestone, ask for explicit normal-chat authorization rather than retrying the same rejection.

Suggested one-time normal-chat authorization, only if needed:
`I authorize Project OutRun v0.4.3 Soft Steering & Honest Curves, superseding the stop-after-v0.4.2 milestone instruction. You may create a local feature branch from my playable v0.4.2 build, selectively import the current v0.4.3 specifications, implement, test and commit locally. No push, merge, public deploy or other-repo changes.`

## Ready-to-paste NEW Codex Goal

```text
/goal Continue the EXISTING playable local Project OutRun v0.4.2 and deliver v0.4.3 Soft Steering & Honest Curves. Preserve gameplay-first Arcade Lateral Balance, all five challenges, accepted 1.75x speed and Pixel 8/PC controls. Verify remote/clean state, branch from playable local HEAD d44c8e5/f7ed029 or later to codex/v0.4.3-soft-steering; fetch origin/main and selectively restore ONLY AGENTS.md, docs/V0.4.3_SPEC.md, docs/V0.4.3_ACCEPTANCE.md and docs/CODEX_V0.4.3_KICKOFF.md, never merge the documentation-only main over the game. Read those docs. P0 steering: keep neutral + four stable notches on each side, finger jitter deadzone/hysteresis, but use fast smooth applied-correction transitions between target notches and faster release to neutral, avoiding visible 0.25 step jerks and avoiding new post-corner inertia. P0 curve VISUAL TRUTH: current extreme bend sometimes looks gentle yet requires braking; inspect shared curvePressure/steeringAuthority calibration, retune GLOBAL pressure-versus-curvature relationship and INVERSE-generate tighter visibly stronger actual 3D bends for the same calibrated required-steering levels. Smooth distance-based curvature transitions so course sections don't look mechanically segmented, but retain Low/Medium/High/Extreme/S challenges and braking-required high-speed failure vs lower-speed success. P1 visual arcade drift: on gentle <=0.25 steering car body remains stable/quiet, on meaningful High/Extreme bend dynamically show exaggerated ~25-45-degree rendered yaw/lean and meaningful skid sound/FX, with visual easing/recovery and NO effect on car actual x/s path or added physical yaw/slip inertia. Maintain fixed camera, 1.75x world flow, shoulder/off-road penalty, left-of-car needle HUD, PC A/D+Space/Enter, Pixel 8 landscape/fullscreen/PWA/two-thumb swap/long-press and no road holes. Autonomously implement, launch browser, compare videos and metrics for all bend levels, actual skid pose vs mild pose, record detent step response/curvature-to-visual tests, inspect mobile/desktop screenshots and >=120s road loop, run build/unit/Playwright, fix any failures and commit locally. Write docs/V0.4.3_HANDOFF.md with PASS/FAIL/UNVERIFIED and exact local playable URLs/evidence. No new cars/biomes/rivals/editor/DDA, no push, merge, deploy, TopWar changes or v0.4.4. Stop for human playtesting.
```

## Handoff standard

Do not hand back only a PASS count. Show at least:
- same input/bend before/after step transition curves;
- side-by-side actual LOW/HIGH/EXTREME 3D lookahead showing more visual bend for more challenge;
- genuine ~25-45° strong body yaw compared with quiet mild correction;
- Extreme same-corner fast-full-lock failure vs early-braked success;
- actual test logs and honest local/Pixel status.

A subjective "fun" verdict belongs to the owner after real driving.
