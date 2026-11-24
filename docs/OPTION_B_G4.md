# Option B default — private preview

Option B is the default vehicle. `?car=classic` explicitly selects the legacy car. Loading completes before the playable start gate; unavailable/invalid body keeps the classic visual with a readable fallback warning. Controllers, occupants and gameplay remain shared.

Stage the owner's approved runtime body in ignored `.local/option-b.glb`. Required SHA256: `01152cd6c938c2bf3298ba3ec18abcc1228e99db0ecae9f1f07a86a48ce6ab00` (545876 bytes). Preserved editable G3 source hash: `a990cfcd6d71d61952a400a5d17d7539eeab412c7d374dc3d3d7b6a483948a39`. Source files/reference images are not repository deliverables.

PowerShell, private local preview only:

```powershell
$env:OUTRUN_PRIVATE_PREVIEW='1'
npm run verify:dev
npm run preview -- --port 5186 --strictPort
```

Private build emits the approved body to a content-hashed runtime path, verifies the source hash and includes it and the approved character assets in the service-worker precache. Runtime checks body integrity before parsing. Failed public packaging is deliberate: **GLOBAL RELEASE BLOCKED — LICENSE**. The private environment flag is not a rights waiver or distribution authorization. Existing Hunyuan output territory restrictions remain; main/global delivery requires a separate legitimate rights/replacement decision. Do not publish private dist or runtime/source binaries.

Loopback dev and production-preview were tested in Chrome: default, explicit classic, missing/malformed fallback, offline reload, controlled SW revision activation/cache-miss repair, camera orbit/L3, vehicle and race recovery. Browser gamepad mocks are not physical-pad evidence. LAN/device secure-context PWA and Pixel 8 remain unverified; no firewall/security changes were made. A new arbitrary asset needs a new reviewed hash/configuration, not renaming under the existing digest.
