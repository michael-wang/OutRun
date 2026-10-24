# Pixel 8 local playtest — landscape fullscreen

**Device:** Google Pixel 8, Android Chrome, 20:9 hardware aspect ratio. The game remains an HTML5 app; no Android APK or public website is required for v0.2.

## Two necessary fullscreen routes

**Chrome browser tab:** A tap on Drive / Fullscreen should call `requestFullscreen()` on the game element, then try `screen.orientation.lock("landscape")`. These APIs can be denied, unavailable or leave system gesture affordances: provide retry/Rotate Device guidance. Browser fullscreen needs a **user gesture**.

**Installed PWA (preferred phone experience):** Valid manifest includes `display: "fullscreen"`, `orientation: "landscape"` and actual icons. Launch from Android home screen. PWA fullscreen display mode is different from Fullscreen API; `document.fullscreenElement` may be null.

Don't claim full immersion from CSS alone or claim OS bars can be hidden with 100% certainty on every platform.

## Recommended test connection: USB + ADB reverse

The existing project is at `C:\astra-dev\OutRun` on Windows. Requires Android Platform Tools (`adb`), USB cable, Pixel USB debugging and device authorization.

1. In PowerShell at the **playable v0.2 checkout**:

   ```powershell
   cd C:\astra-dev\OutRun
   npm install
   npm run build
   npm run preview -- --host 127.0.0.1 --port 4173
   ```

2. In another PowerShell window:

   ```powershell
   adb devices
   adb reverse tcp:4173 tcp:4173
   ```

3. On the **Pixel 8**, visit `http://127.0.0.1:4173/` in Chrome. USB reverse makes the PC server visible at the phone's own loopback address.
4. Drive in browser fullscreen. Use Chrome's Install app/Add to Home screen UI if available; launch installed app while USB mapping and preview server remain running. Installed local app is not a permanent offline standalone package unless explicit offline support was added.
5. If install isn't offered, inspect manifest, correct 192/512 PNG icons, origin eligibility and Chrome diagnostics. For PWA tests use production `preview` rather than relying on the Vite development server.

`127.0.0.1` is a potentially trustworthy localhost origin. A URL like `http://192.168.x.x:5173` may permit gameplay on Wi-Fi but is not an adequate **secure-origin PWA installability test**. Avoid public hosting/tunnels without user permission.

**Alternative (fast gameplay only):** `npm run dev -- --host 0.0.0.0` on PC, open `http://<PC_LAN_IP>:5173/` on Pixel over same Wi-Fi; allow Windows local firewall if needed. This does **not** verify installed fullscreen PWA behavior.

## Human verification on actual Pixel 8

- Landscape Start/Fullscreen actually hides browser chrome, locks landscape where supported, or shows sensible fallback.
- Cutout/safe areas and gesture/navigation zones in both landscape orientations never obstruct steering/gas/brake.
- Left thumb steer + right thumb gas, then steer + brake simultaneously, finger release/cancel order and settings swap survive app restart.
- With no steering at a bend, car runs off-road and slows; turning correctly stays on road; recover and drift.
- Pause/app switch/rotate/fullscreen exit never leaves sticky input or broken WebGL canvas.
- Observe 60 seconds' performance, comfort, heat and audio; if FPS is measurable record it, otherwise do not invent numbers.

Provide observations or a short phone recording for final human acceptance. Until then Codex should mark **Pixel physical checks UNVERIFIED**.

## Technical references
- Pixel 8 hardware: https://support.google.com/pixelphone/answer/7158570
- Fullscreen API: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
- Orientation lock: https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
- Manifest display: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display
- Manifest orientation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/orientation
- PWA install: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- ADB reverse: https://developer.android.com/develop/ui/views/layout/webapps/access-local-server
