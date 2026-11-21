# R6f — 16 independent spring locks, one bounded prototype

2026-11-14，dev **0.10.24**，[Issue #48](https://github.com/michael-wang/OutRun/issues/48)。NT$0，沒有更換引擎或使用付費服務。

**工程整合已完成，但本輪美術結果不合格：分束與活動明顯增加，卻未取得整體美感的明顯改善。** 暗金內層露出太多，髮束看起來稀疏、根部交疊不自然；不能把獨立活動當成漂亮髮型。依使用者的一輪實驗限制，到此停止，不再追加造型候選。交由使用者與 Julia 判斷，不宣告美術 PASS。

## 實際畫面

- [正常追車](chase-comparison.jpg)、[正面 45°](front45-comparison.jpg)、[背後 45°](rear45-comparison.jpg)
- [80 km/h](80-comparison.jpg)、[120 km/h](120-comparison.jpg)、[300 km/h](300-comparison.jpg)、[左彎](left-comparison.jpg)、[右彎](right-comparison.jpg)
- [17.4 秒 wild 實際遊戲影片](wild-gameplay.mp4)

左圖 R6d，右圖 R6f。PC Chrome／RTX 5070 Ti，實際 WebGL，1600×900、DPR 1，1.0 男女主角，原 8m 追車鏡頭，`trafficSeed=42`。45° 特寫僅在驗收頁暫時移動相機，同遊戲光線及裁切，正式追車相機未改。

影片依序為 HUD 14000m 靜止、80、120 km/h；13910m 300 km/h；3305m 左彎與4000m 右彎約280 km/h；最後煞車至靜止。片段間使用開發工具定位，非連續全程駕駛。錄影頁暫停隨機超車歡呼觸發以便比較，遊戲動作沒有刪除。瀏覽器時序未逐幀鎖定，工程測試另驗證相同輸入的確定性。

## 實作

以 Blender 4.5.13 離線製作 **16 個獨立閉合曲線體積**，每束以四控制點、19 環／12 邊的凸透鏡截面塑形，埋入髮根、彎曲中段、收尖末端。它們替換舊外殼，沒有疊加舊殼。前額、兩側、後腦與後頸各有獨立鏈；各束不是單純貼色或掛在同一骨鏈。

深暗金色內層是另一個閉合固定網格，與 16 束合併為單一不透明 skinned mesh／材質。四組金色色階、暗根及底側色帶使用 Vertex Colors，無透明髮片、新貼圖或光源。

**81 骨、16 鏈、64 個活動 Spring joints**。根部前14%從固定根漸變至獨立骨鏈；每束四節活動關節加末端骨。使用現有 `@pixiv/three-vrm-springbone` 求解器。新增頭部球碰撞體，保留頸部碰撞體、固定60Hz步進、暫停／重置／長幀恢復。

`src/cabin-wind.ts` 的 wild 場完全未修改。新鏈在原場取樣，四節使用 mid/mid/tip/tip 頻帶；每束不同 phase／lag、彈性與阻尼，根節力上限1.4、其餘wild上限3.2。舊 R6d 分支維持原參數。這是增加活動自由度，沒有降低風場掩飾僵硬。

## 成本與固定層比例

|項目|R6d|R6f|
|---|---:|---:|
|Triangles|3,559|8,000|
|Render vertices|2,242|4,034|
|GLB bytes|153,240|300,940|
|骨骼／活動關節|25／18|81／64|
|獨立 Spring 鏈|6|16|
|髮型主畫面 draw calls|1|1|
|同位置場景 draw calls|120|120|
|同位置場景 triangles|581,695|586,136|
|完全固定 triangles（含髮根）|1,645（46.2%）|928（11.6%）|

其中 R6f 內層固定網格768 triangles，占總幾何9.6%；剩下160個固定三角形是各束埋入根部。**幾何比例小不代表視覺露出少。** 靜態髮型專用深度投影估計，內層約占追車可見髮型34%、正面45°44%、背後45°32%：暗面過於顯眼，是本輪負面結果的主要原因。這是髮型自身遮蔽的投影估計，未計入臉／車身遮擋、光線或整張畫面的面積比例，精確數字見 [render-costs.json](render-costs.json)。

增加4,441 triangles、56骨與46活動關節；GPU蒙皮及CPU求解工作量提高，draw calls未增加。沒有做最終優化或 Pixel 8 實測，不能以桌機影片推論手機FPS。先前 R6 手機效能退步仍未解決。

## 驗證與限制

`npm run verify:dev`：production build成功，**116個測試檔／508項測試全部通過**。既有大bundle提示仍在。新增驗證：17個閉合網格島、16條獨立有效且歸一的skin、每束上段和髮尾實際活動、固定根位置、暫停完全凍結、reset/replay確定性與長幀恢復。沒有刪除碰撞／幾何／效能安全測試。錄影無page error，載入確認81骨／8,000 triangles，非fallback。

本輪沒有更動臉部、車身、人物比例、動作呼叫、道路、AI、水或鏡頭。頭部球僅提供粗略約束，不能代表完整髮束自碰撞或肩部碰撞已解決。主要待驗收問題是內層暴露、束根接合、整體髮量與柔順美感；不能以本次技術成功宣稱造型成功。

## 試玩與回退

- [R6f wild：正常遊戲](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild)
- [R6d wild：上一版](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild&hairStyle=r6d)
- 定位可加 `at=14000`；左彎 `at=3305`、右彎 `at=4000`。進遊戲後可自行駕駛驗收。

R6f僅在dev啟用，production build仍選R6d。`hairStyle=r6c`、`hairUpper=old`、`hairMid=old`與載入失敗fallback均保留。所有舊GLB未修改；不動main、不建立標籤、不觸發手動CI。

## 可編輯來源與重現

- `scripts/blender/export_r6f_hair.py`：16條明確曲線、體積、顏色、骨骼與蒙皮的唯一離線來源；不是遊戲逐幀產生幾何。
- `public/assets/characters/coast-blonde-r6f.glb`：遊戲資產。
- 本機另存 **`C:/astra-dev/outrun/art-prototype/output/r6f-sixteen-locks.blend`**（忽略目錄），保留原始高模及之前版本。
- 執行 `blender -b -P scripts/blender/export_r6f_hair.py -- public/assets/characters/coast-blonde-r6f.glb` 可重建。
- [asset-audit.json](asset-audit.json)、[capture-summary.json](capture-summary.json) 記錄數量與錄影狀態。
- 先完成build及版本更新，再依序執行 `node docs/art-review/r6f/capture.mjs before`、`after`，以及 `node docs/art-review/r6f/package-evidence.mjs`。使用既有Chrome／Playwright／ffmpeg／ImageMagick。靜止片段預留2秒，避免MediaRecorder編碼啟動期間只輸出空容器。
