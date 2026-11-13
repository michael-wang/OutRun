# Coastal Highway — approved visual references

Approved 2026-11-14 by the owner; art-direction decisions live in `docs/COAST_ART_BIBLE.md`.

**The two PNGs are intentionally worth keeping in Git, but are NOT committed yet.**
The current connected GitHub text editor cannot transfer generated binary image files directly. The owner/Codex must perform this one-time local copy; do not substitute unrelated online images.

| Expected checked-in filename | Use | SHA-256 of source PNG |
| --- | --- | --- |
| `01_STYLE_A_objects.png` | **PRIMARY** look for objects, figures, vehicles, housing, boats, road furniture | `3da32413c447cbfcab5dbf314fdeb6f4c67b789c876e9f68cdce18b891a55c55` |
| `02_STYLE_C_world_banner.png` | **TOP BANNER ONLY**, scenic composition, sunset, water, coastal sweep, atmosphere; NOT the hyperrealistic object treatment | `7ae423e75faf9ba5c9f021735b96a9db4f713ae48aa3e15c2a2da9aaebe40b7d` |

## One-time local handoff (Codex on Windows)

1. Owner downloads `OutRun_art_references_2026-11-14.zip` from the Nov 14 ChatGPT conversation and places it in the local repository root (or tells Codex its local path).
2. From the repository root, in PowerShell:

```powershell
Expand-Archive -LiteralPath '.\OutRun_art_references_2026-11-14.zip' -DestinationPath '.\.art-ref-import' -Force
Copy-Item '.\.art-ref-import\OutRun_art_references_2026-11-14\01_STYLE_A_objects.png' '.\art\reference\coast\01_STYLE_A_objects.png'
Copy-Item '.\.art-ref-import\OutRun_art_references_2026-11-14\02_STYLE_C_world_banner.png' '.\art\reference\coast\02_STYLE_C_world_banner.png'
Get-FileHash '.\art\reference\coast\01_STYLE_A_objects.png' -Algorithm SHA256
Get-FileHash '.\art\reference\coast\02_STYLE_C_world_banner.png' -Algorithm SHA256
```

3. Confirm hashes above, then `git add art/reference/coast/*.png` and commit **PNG files only** to `dev`. Remove the temporary ZIP/extracted directory locally; do not commit either.
4. Codex should read this README and both PNGs before any style-sensitive geometry work.

These are AI-generated **concept references only**. They are not 3D assets, gameplay textures, or instructions to replace the accepted Riviera 62. Images may help design, but Blender/Three.js in-game output controls acceptance.
