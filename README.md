# Project OutRun

**An original arcade-driving game inspired by the feeling of SEGA's 1986 Out Run and 2003 OutRun 2.**

**Status:** v0.4.3 *Soft Steering & Honest Curves* implemented for local human and Pixel 8 playtesting. See [v0.4.3 handoff and evidence](docs/V0.4.3_HANDOFF.md). Physical Pixel 8 results remain unverified.

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
| [docs/V0.4.3_SPEC.md](docs/V0.4.3_SPEC.md) | What to build — and explicitly what *not* to build |
| [docs/V0.4.3_ACCEPTANCE.md](docs/V0.4.3_ACCEPTANCE.md) | Verifiable delivery checklist and browser test matrix |
| [docs/CODEX_V0.4.3_KICKOFF.md](docs/CODEX_V0.4.3_KICKOFF.md) | One-shot task for a Codex development run |

### Starting a Codex implementation run

1. **Open the correct checkout of `michael-wang/OutRun`.** Verify the repository remote before changing files. Suggested local path: `C:\astra-dev\OutRun`. **Never run these instructions inside `C:\astra-dev\topwar`.**
2. Read `AGENTS.md`, then give Codex the task in `docs/CODEX_V0.4.3_KICKOFF.md` (Goal Mode where available).
3. The implementation and runnable commands are below. Read the v0.4.3 handoff before planning further work.

## Run locally

Use Node.js 22.12+ (verified with Node 24.21.0) and npm. From this repository:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173/ and choose **Drive**. Hold Space to accelerate, Enter to brake, and A/D to steer. A/D moves the shared virtual steering position to full lock in 0.4 seconds; release returns it to neutral within 0.125 seconds. On touch, press or slide along the steering strip: the cursor moves continuously and selects four stable notches per direction. Applied correction eases into each notch over 100ms; lifting returns it to zero in 60ms. Match the bend with one, two or three notches; brake to about 190 km/h before the Extreme right-hand bend. Brake takes precedence over gas. W/S and arrow keys remain aliases. P/Escape pauses; R restarts. Sound and Settings are in the Menu. Landscape touch controls support two thumbs; Settings swaps the hand groups and remembers the choice.

```powershell
npm run build
npm run test
npx playwright install chromium
npm run test:e2e
```

For same-Wi-Fi phone play, run `npm run dev -- --host 0.0.0.0 --port 5173 --strictPort` and use the host PC LAN IPv4 address. Browser installation needs network access; playing after installation uses local content only. If 5173 is occupied, Vite prints the alternate port; tests expect 5173. Use the repository's saved lockfile for reproducible dependency versions (`npm ci`).

The development-only `window.__drive` facade exposes a snapshot, sampled track geometry and controlled fixed-step time for tests. Production builds omit it. Evidence is stored in `docs/evidence/`; transient browser results and build output are ignored.

## Process

One milestone at a time: **specify → autonomous implementation and self-QA → local playable handoff → human playtest → next milestone**.

Shipping a small enjoyable drive matters more than a large feature list. A successful build alone is not a successful milestone.
## v0.2 driving and Pixel 8

Arcade Lateral Balance pits each steering notch against outward curve pressure. Neutral on a straight preserves your lateral position; neutral on a bend runs wide. Brake when full steering cannot balance a bend. Off-road drag is progressive. The bounded shoulder keeps the road within reach; steer inward to recover. The chase camera uses a fixed FOV and offset; the route now has a pronounced climb, crest and descent.

Mobile Drive attempts actual browser fullscreen and landscape lock. Fullscreen retries/exits are available in the Menu; rejected or unavailable APIs show guidance while the game remains playable. Two-thumb controls and the persistent hand swap remain available.

For local Pixel testing, build and serve the production PWA:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

With Android Platform Tools and an authorized USB-connected Pixel, run `adb reverse tcp:4173 tcp:4173`, then open `http://127.0.0.1:4173/` on the phone. Chrome may offer Install app. The server and USB mapping must remain available. See [Pixel 8 playtest](docs/PIXEL8_PLAYTEST.md) for actual-device checks; desktop emulation is not device certification.

The production app registers a small network-first service worker. It can reuse previously fetched local assets during a transient disconnect; a complete offline install is not promised. Dev mode does not register it. Icons are original bundled PNGs, reproducible with `node scripts/icons.mjs`.

v0.2 evidence lives in `docs/evidence/v0.2/`; historical v0.1 evidence is unchanged. The development-only facade additionally provides scenario reset, independent heading/velocity/slip/footprint telemetry and fixed camera/fullscreen state. The digital test driver lives exclusively under `tests/`; no autonomous driver runs in the game or production bundle.
