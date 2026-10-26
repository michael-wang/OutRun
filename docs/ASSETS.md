# Asset and dependency provenance

All car geometry, road, scenery, textures, UI and engine/tire audio were authored procedurally in this repository for this prototype. No downloaded artwork, branded vehicle models, music, recordings, fonts, or runtime image/model hotlinks are used. Textures are generated locally in canvas. No SEGA or Ferrari content is included.

Runtime dependency: Three.js (MIT), npm package `three`, source https://github.com/mrdoob/three.js. Its license ships in `node_modules/three/LICENSE`.

Development dependencies: TypeScript (Apache-2.0), Vite (MIT), Vitest (MIT), Playwright (Apache-2.0), and Three.js type declarations from DefinitelyTyped (MIT). Exact resolved versions and transitive dependencies are recorded in `package-lock.json`; dependency license files remain in their npm packages. These tools supply no game art or audio.

Browser tests use Playwright-managed Chromium, downloaded only for development. The built game requires no network assets, account, key, backend, or service.

v0.2 adds original procedural PWA icons (`public/icons/coast-192.png` and `coast-512.png`), authored by `scripts/icons.mjs` using only Node's built-in PNG compression/encoding primitives. The manifest uses the neutral name Coast Drive Prototype. Three.js's bundled MIT-licensed BufferGeometryUtils combines static road markings; no new runtime dependency or external art was added.

v0.3 adds original procedural reflector posts, shoulder paint, lane markings and seeded synthesized wind/engine harmonics. No external artwork, recordings or new dependencies were added. Motion evidence is recorded from this local game using Playwright and installed Edge; extracted PNGs are frames from those recordings.
# v0.3.1 Velocity Gate additions

Road-edge colour bands and the revised instanced reflector shapes are original procedural geometry authored in this repository. Synthesized wind uses the existing seeded local noise source. No external assets or dependencies were added. The v0.3.1 videos and screenshots are recordings of this local application; they contain no externally sourced game imagery or music.

v0.5 adds an original procedurally sculpted roofless roadster, cockpit, two stylized travelers, and FAST SWEEP signs. Geometry/materials are defined locally in src/car.ts and src/world.ts. No external models, character likenesses, artwork or dependencies were added. Static car geometry uses the existing Three.js MIT BufferGeometryUtils. No skeletal animation or runtime asset downloads.

## v0.6 Scenic Journey
All new wheels, travelers/hair pivots, coast/canyon/city prop geometry, landmarks, road and palette art are original procedural local code in src/wheels.ts, src/car.ts, src/occupants.ts, src/scenery.ts and src/world.ts. No external models, textures, likenesses, audio or dependencies added. Existing Three.js MIT geometry helpers are reused. No runtime asset downloads.

## v0.7A Challenge Brick Lab
Eight authored road/elevation profiles, a crest-warning sign and the review interface reuse the existing original procedural scenery and vehicle. No external assets or new dependencies. The evidence screenshots/videos record this local application; SVG plots derive from its recorded browser telemetry.

## v0.7A.1 Verticality & Variable Width
Lane geometry, narrowing signs and slope-following scenery foundations are original procedural code. No external art, audio, models or dependencies were added. Comparison media records the local r1 and r2 game. The archived R1 JSON contains the owner's original reviews.
