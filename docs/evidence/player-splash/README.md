# Player-first splash screen

Base: dev at 83eaa8f83d6a1bee2f7588722ac4b475a1a904fa. Initial worktree contained only the two approved, untracked PNG assets.

## Findings and implementation

Confirmed startup regression: the existing markup used class="player-title" without id="player-title", while updatePlayerUi() dereferenced $('player-title').textContent. The initial ui() call runs before resize(), requestAnimationFrame(loop), and mountL2Lab. The exception therefore prevented the animation loop/commit pumping and player callbacks from being installed. This was an actual broken startup, not simply a slow Worker. The focused mutation test restores that missing ID and captures the exact TypeError in startup-regression.json.

Fixed the ID. Removed opening-road-preview.ts and its creation, disposal and restart paths. The temporary road-only mesh no longer serves as a startup background. No procedural geometry, camera, physics, controls, Worker scheduling or streaming window changed.

The exact approved PNGs are now selected by a native picture element in initial HTML. A portrait media source and a landscape fallback fetch only the chosen image, confirmed by browser resource entries. There is no duplicate preload, JavaScript image decoder, new texture upload, or replacement artwork. Offline registration also explicitly caches the dynamic game module and the selected artwork, and handles registration after the window load event. Sources remain unchanged (landscape 1,881,497 bytes; portrait 1,722,608 bytes). Cover cropping retains the car, with a portrait-specific horizontal focal point. Inline critical styling displays the artwork even while the game module is withheld. Text and buttons remain DOM overlays, with safe-area/dynamic-viewport styling. A small bootstrap catches module initialization failures and offers reload/retry; a 120-second bootstrap timeout also exposes recovery.

The public launch presents the title, subtitle, Start driving, Controls and Sound. Engineering panels remain under ?qa=1 (stream log export: ?qa=1&streamdiag=1). The existing DEV default continues to expose the lab for historical test compatibility; ?playerui=1 exercises public UI locally, and production defaults to public UI. Public portrait shows only the two requested rotation lines, except when an error/slow-loading retry is needed. iPhone fullscreen and installation guidance remain in QA. No inert fullscreen button is added.

The splash remains until a safe start, and is hidden for driving/countdown. Ordinary pause/resume retains the actual scene. Restart reuses the splash while its initial window loads. Controls and Sound use existing handlers. The loading button is disabled until the existing streamer.ready condition passes; no readiness or safety criterion was weakened. That condition still includes nearby scenery, so slow scenery generation can still delay initial readiness. Changing that policy is outside this Goal.

Worker failures retain existing two retries and 30-second pending-request watchdog. Permanent failure gives a readable message and Retry loading; after 45 seconds of preparation, the player can continue waiting or reload. The silent-Worker test advances performance time by 46 seconds to test this UX without a real 46-second wait; it is not a device performance measurement. A delayed init message remains on artwork, then starts only after attached road is ready. Injected Worker construction failure never enables Play.

## Validation conditions and evidence

Windows desktop, headless Chromium 156.0.8078.4, SwiftShader, one Playwright worker, local production preview on 127.0.0.1:4173 and Vite on 5173. Production layout tests use fresh contexts, service workers blocked, and viewports 1440x900, 390x844 and 844x390. Mobile contexts are browser emulation, not physical Pixel/iPhone tests. Other existing tests use their existing context configuration.

Commands:

- npm run build
- npx vitest run tests/stream-reliability.unit.ts --reporter=verbose
- npx playwright test --config=playwright.worker.config.ts tests/player-splash.spec.ts tests/player-first-start.spec.ts tests/ios-immersive.spec.ts tests/stream-reliability.spec.ts tests/v09-offline.spec.ts --reporter=line

The worker config reuses the already-running production preview without terminating the user's server. The default config initially refused to start because that port was occupied.

Focused stream reliability unit tests: 10/10 PASS. Build PASS (existing bundle-size warning). Browser results are recorded in browser-tests.txt. Old public-install-help and diagnostics-without-QA assertions were updated to match the requested minimal interface. An early delayed-Worker test intercepted the Worker URL import as well as the actual Worker and stalled main-module evaluation; the final test instead holds only the init message. These were test adaptations, not application failures. The unrelated full legacy suite was not run; previously documented legacy unit failures are not reclassified here.

Per-viewport JSON contains page-relative time when readiness was observed, after layout assertions/screenshot. These are single-sample upper bounds, not exact Worker CPU timings or a benchmark. No claim of physical-device startup performance is made. Screenshots: desktop.png, portrait.png, landscape.png and gameplay.png. startup-regression.json captures the reproduced missing-ID failure. failed-worker.json/png and silent-worker.json capture recovery states. Regression outputs from the existing streaming safety tests are copied into regressions/; their original historical archives are preserved.

## Remaining review

No indefinite preparation reproduced after the ID fix with a functioning Worker. Slow/failed generation is now recoverable but still depends on device throughput and the existing road-plus-scenery readiness policy. Physical Pixel 8 and iPhone Safari/browser-chrome acceptance remains UNVERIFIED. Image download over slow networks can still take time; images are eager/high priority and only the selected source is requested. No deployment or main promotion is authorized or performed.

## Changed files

- index.html, src/startup.ts: immediate responsive artwork and bootstrap recovery.
- src/main.ts: missing-title fix, splash lifecycle, public loading/retry, QA-only diagnostics, offline asset continuity.
- src/style.css: overlay layout, portrait cropping, safe areas and error visibility.
- src/opening-road-preview.ts: removed obsolete temporary mesh.
- public/ui/start-landscape.png and start-portrait.png: approved original assets added unchanged.
- tests/player-splash.spec.ts: focused behavior/reproduction checks.
- tests/player-first-start.spec.ts, tests/stream-reliability.spec.ts, tests/v09-offline.spec.ts: align existing assertions with the new public/QA entry.
- docs/evidence/player-splash/: screenshots, JSON and verification report.

Final status: build PASS; focused unit tests 10/10 PASS; browser tests 21/21 PASS (49.1 seconds), including offline reload. No remaining failures in the selected checks. Physical-device acceptance UNVERIFIED.

Observed readiness upper bounds in this run: desktop 0.82 s; portrait 0.73 s; landscape 0.72 s.
