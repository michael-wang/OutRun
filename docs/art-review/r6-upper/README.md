# R6b / wild — 上半部髮束精修

2026-11-14，dev 0.10.22。單輪造型樣品，待使用者／Julia 美術驗收。

## 交付

- [正面 45° 前後對照](front45-comparison.jpg)
- [背後 45° 前後對照](rear45-comparison.jpg)
- [原追車鏡頭前後對照](chase-comparison.jpg)
- [wild 實際遊戲短片，約 22 秒](wild-gameplay.mp4)

圖左為原 R6b，右為本輪精修。45° 是錄影工具臨時使用的檢視相機，在同一個遊戲場景、夕陽光線拍攝；交付對照圖採同範圍裁切、未美化或重畫。追車圖與影片保留正常 8m 鏡頭、1600×900、DPR 1。影片為 PC Chrome／RTX 5070 Ti 遊戲 WebGL 實錄，非 Blender 預渲染、非 Pixel 8 錄影。

## 本輪改了什麼

**造型與表面明暗兩者都有；風場與動態系統沒有修改。**

1. 以原 R6b 網格為底，局部細分上半部的大三角面，在既有髮流上雕出七道不等距、帶彎曲的淺凹槽。向內最大約 4 mm，不外加第二層髮殼，不把髮型堆厚。
2. 凹槽兩側產生不同法線／切面，高光不再只連續跨過原本的大平滑面；用少量頂點色明暗補強分束。沒有改整體金髮色系，沒有新貼圖、新材質或 shader。
3. 頭頂固定骨、25 根骨骼、18 個 Spring 關節、原始頂點蒙皮、彈性、阻尼、wild 風力、男女主角 1.0 比例皆保留。沒有加入上半部次級動態。

髮根局部座標高度 <= 0.065m 的原有頂點，其位置、法線、顏色與權重逐值保持；新增頂點僅沿上方既有邊插值權重。既有中下段與髮尾造型不重新製作。使用相同 wild 輸入的成對測試確認骨骼軌跡一致，取樣下半部蒙皮後位置差 < 1e-7m。

## 視覺觀察與待驗收

背後 45° 現在能看到更清楚的大髮束明暗分界；正面保留原有側掃瀏海，在上層增加淺分束。正常追車距離可看到較分段的金色亮帶，中下段仍持續飄動，沒有把上半部變成額外亂飛的區域。

這是保守精修，仍沿用原模型較有稜角的面貌，**不是把整個角色提升成參考圖的高精度模型**。最需要使用者驗收的是：實際追車距離的分束強度是否足夠，以及凹槽的明暗是否自然；本輪不再自行增加更多層或更強動態。

## 成本與工程驗證

|項目|原 R6b|本輪|
|---|---:|---:|
|髮型 triangles|2,279|7,424|
|render vertices|1,592|4,376|
|GLB bytes|109,144|295,944|
|材質／mesh|1／1|1／1|
|骨骼／活動關節|25／18|25／18|

為讓凹槽形成真正切面，增加 5,145 triangles，GPU 蒙皮頂點數也增加；沒有新增 draw call 或動態光源。載入器仍保留有界檢查，新版上限 7,500 triangles，兩個舊版仍為 2,500。沒有把效能安全檢查刪掉。本輪沒有重新量測 Pixel 8 FPS，不宣稱手機效能驗收通過。NT$0。

`npm run verify:dev`：build 成功，**114 個測試檔／504 個測試通過**。Vite 既有大型 bundle 警告仍在。新增的測試檢查上半部修改範圍、下半部資料不變、權重歸一、相同 wild 骨骼與髮尾運動。實際遊戲錄影無 page error；[錄影摘要](capture-summary.json)、[資產摘要](asset-audit.json)。

## 可玩版本與回退

- [本輪 wild](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild)
- [原 R6b / wild](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild&hairUpper=old)
- `hairMid=old` 仍可回到更早的 R6 蒙皮；舊 GLB 均未覆寫。

影片順序：HUD 14000m 靜止、60、80、120 km/h → HUD 13910m 300 km/h → HUD 3305m 左彎 → HUD 4000m 右彎 → 煞車回穩；`trafficSeed=42`。片段之間以開發工具定位，煞車則接續右彎。錄影頁暫停隨機超車歡呼以利觀察，正式遊戲動作沒有修改。

## 素材與重現

- 執行 `python scripts/blender/refine_r6_upper.py public/assets/characters/coast-blonde-r6b.glb public/assets/characters/coast-blonde-r6b-upper.glb` 可從原檔重建精修 GLB；需要 numpy，使用既有隔離 Python 環境，沒有新增遊戲依賴。
- 本機 Blender 4.5.13 已實際匯入網格／骨架並另存可編輯檔：`C:/astra-dev/outrun/art-prototype/output/r6-upper.blend`（本地忽略目錄）。亦可用 Blender `-b -P scripts/blender/refine_r6_upper.py -- INPUT OUTPUT` 重建並另存。
- `node docs/art-review/r6-upper/capture.mjs before`、`after` 取得對照及 wild 影片；`node docs/art-review/r6-upper/package-evidence.mjs` 包裝交付。需要本地 5194 dev server、Chrome、Playwright、ffmpeg、ImageMagick。
- 新 GLB SHA-256：`EB5CF1B2082327CA6052474019FAE7549070774E1F42632948410A4915085A20`。
- 原 R6b GLB SHA-256：`188B5914F3247CA283179655B90BC6949FAE530B9A7E9BA4889C8703B15FD8C9`，本輪保持不變。
