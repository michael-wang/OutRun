# Current assets and third-party provenance

- Runtime framework: Three.js (`three`), plus `html2canvas`. Versions and dependency sources are locked in `package-lock.json`.
- The game currently includes in-repository car/scene geometry code, GLB/texture/audio assets, a vendorized Ultra Water implementation and other vendor code under `src/vendor/`. Asset licenses and origins need review before commercial distribution; do not assume every asset is original simply because it is in the repository.
- Development tools include Vite, TypeScript, Vitest, Playwright and the tree-generation pipeline (`@dgreenheck/ez-tree`). Consult their bundled licenses and original vendor notices.
- New Blender/67.js outputs must have recorded origins, clear rights, reasonable mobile geometry/material budgets, and stable local asset references (no runtime reliance on editor/cloud URLs).
- Historical per-version asset descriptions have been retired from the active docs. They remain available in Git history.
