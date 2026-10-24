# Asset and dependency provenance

All car geometry, road, scenery, textures, UI and engine/tire audio were authored procedurally in this repository for this prototype. No downloaded artwork, branded vehicle models, music, recordings, fonts, or runtime image/model hotlinks are used. Textures are generated locally in canvas. No SEGA or Ferrari content is included.

Runtime dependency: Three.js (MIT), npm package `three`, source https://github.com/mrdoob/three.js. Its license ships in `node_modules/three/LICENSE`.

Development dependencies: TypeScript (Apache-2.0), Vite (MIT), Vitest (MIT), Playwright (Apache-2.0), and Three.js type declarations from DefinitelyTyped (MIT). Exact resolved versions and transitive dependencies are recorded in `package-lock.json`; dependency license files remain in their npm packages. These tools supply no game art or audio.

Browser tests use Playwright-managed Chromium, downloaded only for development. The built game requires no network assets, account, key, backend, or service.

v0.2 adds original procedural PWA icons (`public/icons/coast-192.png` and `coast-512.png`), authored by `scripts/icons.mjs` using only Node's built-in PNG compression/encoding primitives. The manifest uses the neutral name Coast Drive Prototype. Three.js's bundled MIT-licensed BufferGeometryUtils combines static road markings; no new runtime dependency or external art was added.
