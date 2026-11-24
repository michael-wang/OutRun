# R7A — 女主角上半身遊戲整合候選，v0.10.27

Issue [#49](https://github.com/michael-wang/OutRun/issues/49)。2026-11-14，依使用者授權完成 **dev 可遊玩整合**，現在停止，等待 Julia 與使用者美術驗收。未製作男主角、改車、改鏡頭或再開髮型實驗；額外支出 NT$0。

## 成果與待驗收問題

以已接受的 `heroine-color-study.blend` 為唯一 3D 來源，保留臉部、眼眶、棕色虹膜、鼻唇、耳環、頸肩、鎖骨、上胸與掛頸衣料。沒有重新生成角色或用程式幾何重新造臉。從約 148 萬三角形原模型移除舊高模頭髮，以 Blender 加權減面保護五官及塗色，再做下胸座位適配與肩口整理。

臉部體積與辨識度明顯超過舊程式臉，但 **不等於美術驗收通過**：

- 肩部與沿用的活動手臂仍有明顯硬接縫、法線及局部膚色差異，尤其正面／揮手近拍。手臂不是本輪重製的完整角色手臂。
- 掛頸衣料保留原胸像皺褶，減面後輪廓仍粗；與沿用的下方裙身交界不夠自然。
- 眼瞼／眉毛塗色邊界近看仍有碎邊。沒有改造已接受的鼻子、下巴。微笑與小幅張嘴只提供最小控制，沒有口腔、牙齒或語音口型。
- 實際夕陽下膚色比中性 Blender 畫面更橘。棚拍與遊戲圖分開呈現。
- R6d 頭髮形狀、材質、Spring Bones、wild 風場完全保留；其既有表面問題不在本輪調整。

## 六組實際遊戲畫面

[核准 H1aR 設計](approved-reference.png)／[設計與實際 Blender 3D 對照](reference-vs-3d.jpg)。後者上列是概念設計，下列是實際減面模型；側面方向不同，未翻轉模型。

| 視角 | R7A 遊戲畫面 | 相同相機舊／新對照 |
| --- | --- | --- |
| 正面 | [front](after-front.jpg) | [compare](compare-front.jpg) |
| 前方 45° | [front45](after-front45.jpg) | [compare](compare-front45.jpg) |
| 側面 | [side](after-side.jpg) | [compare](compare-side.jpg) |
| 背面 | [back](after-back.jpg) | [compare](compare-back.jpg) |
| 座艙 | [cockpit](after-cockpit.jpg) | [compare](compare-cockpit.jpg) |
| 正常追車 | [chase](after-chase.jpg) | [compare](compare-chase.jpg) |

補充：[中性表情](after-neutral.jpg)、[揮手](after-cheer.jpg)、[左轉頭](after-look-left.jpg)、[右轉頭](after-look-right.jpg)、[高速追車](after-chase-fast.jpg)。追車視角的新臉被後腦遮擋，主要差異是頸背與肩部，不能以此宣稱已驗收正面五官。

Blender 棚拍：[正面](studio-front.jpg)、[45°](studio-front45.jpg)、[側面](studio-side.jpg)、[背面](studio-back.jpg)。同一輕量上半身加凍結 R6d 頭髮，不含遊戲中沿用的手臂與下裙；可見肩部截口，不是完整站姿人物。

### 實際遊戲短片／重現

[8 秒 wild 追車短片](chase-wild.mp4)：HUD 約 3502→4249m，約 224 km/h，原本 8m 追車鏡頭。實際遊戲迴圈與頭髮動態；3–4.8 秒由驗收腳本呼叫既有揮手姿勢，沒有新增正式遊戲事件。Canvas 錄影附驗收字幕，不含 DOM HUD，無 AI 生成畫面。

- Vite dev：`http://127.0.0.1:5194/?at=3210&trafficSeed=42&hairWind=wild`。
- 舊乘客回退：加 `&heroine=previous`，仍是 R6d 頭髮與 1.0 人物。
- 重拍：`node docs/art-review/r7a/capture.mjs before` 及 `node docs/art-review/r7a/capture.mjs after`，使用專案既有 Playwright／本機 Chrome。
- 靜態比較：seed 42、HUD 3210m、1600×900、DPR 1。在驗收頁面暫停模擬、抑制隨機歡呼以比較相同姿勢。近拍相機僅由腳本暫時設定，不改正式鏡頭或 UI。Chrome page errors 為 0。

## 模型與成本

| 項目 | 本輪數據 |
| --- | --- |
| 上半身 GLB | `public/assets/characters/coast-heroine-r7a.glb` |
| 三角形 | **30,502**，不含凍結頭髮及舊手臂／下裙 |
| Blender 頂點 | 16,202；glTF 材質邊界可能拆頂點 |
| GLB 大小 | **1,361,900 bytes，約 1.30 MiB** |
| 不透明材質／主畫面 draws | 4：皮膚五官、象牙白衣料、金耳環、棕眼睛 |
| 骨骼／表情 | 2 bones；`smile`、`mouthOpen` |
| 相同追車場景 calls | 469 → 472，**淨增 3** |
| 相同追車場景 triangles | 753,491 → 782,785，**淨增 29,294** |
| 凍結 R6d 頭髮 | 3,559 triangles／25 bones／18 spring joints，未修改 |

原始量測：[before](before-metrics.json)、[after](after-metrics.json)、[資產稽核](asset-audit.json)。場景數據為固定相機的 Three.js `renderer.info.render`，不是整個多 pass GPU 成本或手機 FPS；陰影 pass 可能另外繪製。新增 skinning／morph vertex 工作與資產記憶體；未新增燈光、貼圖、透明髮片或角色引擎。**未實測 Pixel 8**，不能宣稱效能無退步或可公開發布。

## 方案與修改檔案

- `scripts/blender/export_r7a_heroine.py`：原胸像衍生減面、vertex colors、肩口整理、兩骨頸部權重與最小表情，匯出 GLB／Blender。臉部比例保留，只有下胸配合現有座位。
- `src/heroine-bust-asset.ts`：一次載入快取、大小／材質／rig 檢查、獨立角色副本；失敗回退舊乘客。
- `src/car.ts`：新頭頸肩胸接到既有乘客座位與頭部 pivot，沿用活動手臂及下裙，移除重複舊肩頸／衣帶。人物維持 1.0。
- `src/occupants.ts`：既有轉頭／揮手／歡呼接到新 rig；有界 `setPassengerLook(yaw)` 預留左右看向。沒有新賽事事件或語音。
- `src/passenger-cheer.ts`、`src/hero-tailoring.ts`：新乘客略過舊中央肩頸片與衣帶；男主角和舊乘客路徑維持原行為。
- `src/main.ts`、`src/runtime-query.ts`：DEV 預設新女主角，`heroine=previous` 可回退。production 保留舊乘客，待美術／手機驗收另行決策；沒有發布 main。

### 本機 Blender 路徑

- 原始上色高模，未修改：`C:/astra-dev/tools/outrun-h1ar3d/heroine-color-study.blend`
- 輕量可編輯上半身：`C:/astra-dev/outrun/art-prototype/output/r7a-heroine-upper-body.blend`
- 含凍結 R6d 頭髮及棚拍相機：`C:/astra-dev/outrun/art-prototype/output/r7a-heroine-review.blend`

Blender 保存在忽略的本機製作目錄；Git 提交遊戲 GLB、重建腳本、稽核及驗收證據，不推原始高模／ZIP。Blender 4.5.13，本機 RTX 5070 Ti／Cycles OPTIX。從 repo 根目錄執行 Blender `-b -t 4 -P scripts/blender/export_r7a_heroine.py` 重建；`render_r7a_review.py` 生成棚拍。

SHA-256：

- 原始上色高模：`4ec7144aa55e7b4e27dbdd87c26a28ab6667b9cfc911d2a3057b9c95e3fd8e97`，匯出前後相同。
- 凍結 R6d GLB：`8273fe14b4f1c83a4c8b574bacd7d834a6142380013e6e8ebb6f7b447399f519`，單元測試固定檢查。
- 核准三視圖：`7b0e29254250ea481bfdc0dc943f3987d5c2c332481866ddd532c0d52b03b727`。

原 Hunyuan3D 2.1 素模來源與授權沿用既有研究記錄；本輪不代表全球商業發行授權已審查完成。

## 驗證與交接

`npm run verify:dev`：scenic check／contract、TypeScript、Vite build 通過；**118 files／512 tests passed**。[本地完整輸出](verify-dev.log)。沒有刪除原有安全檢查。新測試涵蓋實際 GLB 邊界、權重、角色獨立表情、頭髮雜湊、轉頭／揮手／重設、wild 動作穩定、資源釋放及載入失敗回退。

待 Julia／使用者驗收新臉與眼神、夕陽膚色、肩部與衣料接合；Pixel 8 效能待測。**本輪到此停止，不自動進行男主角、車體或下一輪髮型製作。**
