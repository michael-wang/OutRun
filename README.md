# Project OutRun

**An original arcade-driving game inspired by the feeling of SEGA's 1986 Out Run and 2003 OutRun 2.**

**Status:** Preproduction — v0.1 *First Drive* specification ready; implementation not started.

"Project OutRun" is an **internal codename only**. **SUNSHIFT GT** is an unapproved candidate public name, not a final title. Do not use SEGA logos, the original game's music, graphics, distinctive licensed vehicles, or other protected assets. Public branding will be decided later.

## North star

A beautiful sunlit coastal highway, a stylish sports car, thrilling speed, and satisfying recoverable drifts. **A joyride, not a racing simulator.**

For v0.1, the player can simply drive for at least a minute on a scenic, winding 3D road using steering, acceleration, and braking. No opponents, races, scoring, or progression yet.

- **Rendering:** Real 3D car and road, plus stylized 3D scenery and 2D distant landscape where useful.
- **Tech:** Three.js, TypeScript, Vite; lightweight arcade vehicle dynamics rather than a full physics simulation.
- **Desktop controls:** Keyboard.
- **Mobile controls:** Two-handed landscape layout; steering on the left and vertical accelerator/brake on the right, with a setting to swap sides.
- **Workflow:** Codex independently implements, launches, plays/tests, fixes, and submits one **locally playable** version; a human then evaluates the feel and visuals before planning the next version.

## Start here

| File | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Codex operating rules; repo safety and autonomy |
| [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | The experience and visual direction we are pursuing |
| [docs/V0.1_SPEC.md](docs/V0.1_SPEC.md) | What to build — and explicitly what *not* to build |
| [docs/V0.1_ACCEPTANCE.md](docs/V0.1_ACCEPTANCE.md) | Verifiable delivery checklist and browser test matrix |
| [docs/CODEX_KICKOFF.md](docs/CODEX_KICKOFF.md) | Ready-to-paste /goal command and detailed development brief |

### Starting a Codex implementation run

1. **Open the correct checkout of `michael-wang/OutRun`.** Verify the repository remote before changing files. Suggested local path: `C:\astra-dev\OutRun`. **Never run these instructions inside `C:\astra-dev\topwar`.**
2. Open the OutRun checkout as a **Local** Codex project, then paste the **ready-to-use `/goal` command** from `docs/CODEX_KICKOFF.md` into a Codex Goal (where supported). This is the intended autonomous development mode.
3. Codex should generate the app and its real npm scripts. When implementation exists, the expected commands are `npm install`, `npm run dev`, `npm run build`, `npm run test`, and `npm run test:e2e`.

This repository currently contains specifications, **not a playable build**. README run commands become actionable when Codex completes v0.1.

## Process

One milestone at a time: **specify → autonomous implementation and self-QA → local playable handoff → human playtest → next milestone**.

Shipping a small enjoyable drive matters more than a large feature list. A successful build alone is not a successful milestone.
