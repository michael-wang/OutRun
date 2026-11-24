# R7H 服裝尺度修正 — v0.10.29

2026-11-15。依使用者新方向，只將掛頸象牙白短洋裝改為「露肩、露上背、半露背」，停止於本次服裝驗收；未重做角色或擴充功能。

## 改動與保存

- 背部開口的最低點從角色局部高度 **0.855m 提高至 1.100m（+24.5cm）**，在肩胛骨下方附近；兩側接至約 1.135m。保留肩頸／上背，腰部與下背完整覆蓋。
- 使用原洋裝的一體後片，透過側片漸變銜接原前領；沒有加橫帶、胸罩狀分件或斜背帶。原掛頸前領中心、裙擺、腰結、材質與動畫保持既有設計。
- [匯出資料逐項比對](asset-audit.json)：非衣料 mesh 的座標、法線、顏色、indices、morph 完全一致；skin bind 與所有 7 個 clips（五指定動作＋wave/applause）也完全一致。R6d 髮型 SHA-256 仍為 `8273fe14b4f1c83a4c8b574bacd7d834a6142380013e6e8ebb6f7b447399f519`。
- 沒有修改 `src/` 任何遊戲程式，男主角、車體、相機、超車事件、wild 風場及人物 1.0 scale 均保留。
- [新參考圖](approved-half-back.png)為使用者本輪提供的半露背設計，SHA-256：`fdc7560fa79aadc1e71e07493be688402465e5987947dc1d4bd93888b85de61d`。沿用既有臉與頭髮，不將新概念圖視為重製人物的授權。

## 驗收材料

- [遊戲背面修改前後對照（左舊、右新）](compare-back.jpg)
- [背後 45° 修改前後對照（左舊、右新）](compare-rear45.jpg)
- [Blender 背面修改前後對照](compare-studio-back.jpg)
- [正常追車後視角](game-chase.jpg)
- [起身向左吆喝後視角](game-shoutLeft.jpg) · [起身向左飛吻](game-kissLeft.jpg) · [雙手高舉歡呼](game-victory.jpg)
- [約 11 秒 wild 實際遊戲短片](coverage-wild.mp4)：坐姿 → 左吆喝 → 左飛吻 → 過頭歡呼。

遊戲畫面均為本機 Chrome 真實 WebGL，1600×900、DPR 1、`trafficSeed=42`、`hairWind=wild`。靜態圖採 HUD 3210m；影片以原 8m 追車鏡頭、約 224 km/h 行駛，使用已有 DEV 動作播放／對手定位工具，字幕只存在錄影 Canvas。沒有鏡像、AI 影片或正式 UI 變更。前後比較使用相同程式／鏡頭，只在「修改前」頁面攔截 GLB 請求並載入精確的 v0.10.28 資產。

檢查坐姿、左吆喝、左飛吻、過頭歡呼的後片輪廓與腋下交界，所提供畫面未見明顯穿模或獨立內衣狀橫帶。是否符合最終尺度與美感仍由 Julia／使用者驗收；原 R7H 近拍臉部與肘部的既知造型限制不在本輪改動範圍。

## 模型、重現與驗證

| 資產 | triangles | draws（材質批次） | GLB bytes |
| --- | ---: | ---: | ---: |
| 賽車版 | 28,647（不變） | 4（不變） | 1,559,060（+336） |
| 全身版，含凍結髮型 | 40,238（不變） | 5（不變） | 2,049,728（+336） |

沒有增加骨骼、動畫、材質或 runtime 邏輯。沒有宣稱新的手機 FPS 結果。

- 可編輯母檔：`C:/astra-dev/outrun/art-prototype/output/r7h-heroine-fullbody.blend`；站姿預覽：`r7h-heroine-review.blend`。
- 原版另存：`C:/astra-dev/outrun/art-prototype/output/r7h-heroine-fullbody-v028.blend`、`r7h-heroine-review-v028.blend`。原 GLB 可從 Git commit `f74e0f46a611b5979fe1bee0f53e443517e15a58` 還原；既有 R7H 驗收圖片未覆寫。
- 匯出／棚拍仍使用 `scripts/blender/build_r7h.py`、`scripts/blender/render_r7h.py`；設定環境變數 `OUTRUN_HEROINE_REVIEW=docs/art-review/r7h-coverage` 可將本次輸出與舊驗收材料分開。
- 拍攝：`node docs/art-review/r7h-coverage/capture.mjs before`／`after`。前者需要將原版 GLB 放在 `test-results/r7h-coverage/before-race.glb`；資料比對另需 `before-full.glb`。
- 本地 `npm run verify:dev`：**通過**（scenic:check、scenic:test、TypeScript＋Vite build、120 檔／517 tests）。既有安全測試全部保留；服裝 raycast 檢查更新為上背露膚、下背由衣料覆蓋。Chrome 兩個比較頁面均為 0 page errors，影片解碼檢查通過。
- 遊玩：`http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild`。只交付 dev，不修改或發布 main。
