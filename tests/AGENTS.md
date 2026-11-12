# Tests — independent QA guidance

The test suite is a tool, not the definition of a successful personal-game release.

- **P0 (blocking):** prevent fundamental launch/playability failures such as missing road, game startup failure or impossible driving.
- **P1 (report, not blocking):** serious race state loss, crash, broken recovery or major collision/AI malfunction. Report the failure to the owner with its real player impact.
- P2/P3 UI alignment, detailed art, audio polish, legacy lab behavior and browser timing: run **on demand**, not as a release gate.
- Favor behavior and invariants over assertions tied to source text, private variable names or exact DOM structure. Drop tests for retired features once their dependencies are removed.
- Do not hide a real P0 as a flaky test. Distinguish test-environment limitations from observable game failures.
- `npm run test:p0`, `npm run test:p1`, `npm test` (entire historical suite); `npm run build` checks TypeScript and production output.

- R3 closed: compare the authored road and Worker contract directly; retired Pilot/Trip seeds and Brick/L2 review labs are not test inputs. Preserve current coastal scenery, AI/traffic, guardrail and road-safety regressions.
