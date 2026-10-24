# Project OutRun

**An original arcade-driving game inspired by the feeling of SEGA's 1986 Out Run and 2003 OutRun 2.**

**Status:** v0.1 *First Drive* implemented for local human playtesting. See [handoff and evidence](docs/V0.1_HANDOFF.md).

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
| [docs/CODEX_KICKOFF.md](docs/CODEX_KICKOFF.md) | One-shot task for a Codex development run |

### Starting a Codex implementation run

1. **Open the correct checkout of `michael-wang/OutRun`.** Verify the repository remote before changing files. Suggested local path: `C:\astra-dev\OutRun`. **Never run these instructions inside `C:\astra-dev\topwar`.**
2. Read `AGENTS.md`, then give Codex the task in `docs/CODEX_KICKOFF.md` (Goal Mode where available).
3. The implementation and runnable commands are below. Read the handoff before planning any work beyond v0.1.

## Run locally

Use Node.js 22.12+ (verified with Node 24.21.0) and npm. From this repository:

```powershell
npm install
npm run dev
```

Open http://127.0.0.1:5173/ and choose **Drive**. W/up accelerates; S/down brakes; A/D or left/right steers. P/Escape pauses; R restarts. Sound and Settings are in the top bar. Landscape touch controls support two thumbs; Settings swaps the hand groups and remembers the choice.

```powershell
npm run build
npm run test
npx playwright install chromium
npm run test:e2e
```

The development server binds only to localhost. Browser installation needs network access; playing after installation uses local content only. If 5173 is occupied, Vite prints the alternate port; tests expect 5173. Use the repository's saved lockfile for reproducible dependency versions (`npm ci`).

The development-only `window.__drive` facade exposes a snapshot, sampled track geometry and controlled fixed-step time for tests. Production builds omit it. Evidence is stored in `docs/evidence/`; transient browser results and build output are ignored.

## Process

One milestone at a time: **specify → autonomous implementation and self-QA → local playable handoff → human playtest → next milestone**.

Shipping a small enjoyable drive matters more than a large feature list. A successful build alone is not a successful milestone.
