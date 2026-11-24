# R6d — five sculpted cover locks / gold grouping

2026-11-14，dev 0.10.23，[Issue #47](https://github.com/michael-wang/OutRun/issues/47)。**單輪美術候選，未宣告美術 PASS 或手機效能通過。** NT$0。

## 驗收素材

- [正面 45° 前後](front45-comparison.jpg)、[背面 45° 前後](rear45-comparison.jpg)
- [正常追車／靜止](chase-comparison.jpg)、[80 km/h](80-comparison.jpg)、[120 km/h](120-comparison.jpg)、[300 km/h](300-comparison.jpg)
- [左彎](left-comparison.jpg)、[右彎](right-comparison.jpg)
- [16.3 秒 wild 實際遊戲影片](wild-gameplay.mp4)

左圖 R6c v0.10.22，右圖 R6d。PC Chrome／RTX 5070 Ti，實際遊戲 WebGL 截圖與錄影，未美化；原 8m 追車鏡頭、1600×900、DPR 1、1.0 男女主角、`trafficSeed=42`。45° 僅是驗收工具的臨時特寫相機，同遊戲光線，兩邊採相同裁切。正常追車對照保持完整畫幅。

影片順序：HUD 14000m 靜止、80、120 km/h；13910m 300 km/h；3305m 左彎、4000m 右彎（約 280 km/h）；接續煞車至靜止。片段間以開發工具定位，非全程連續駕駛。僅錄影頁停用隨機超車歡呼觸發，正式遊戲人物動作未改。瀏覽器時序／環境風取樣時間不逐幀鎖定；動態一致性另有相同輸入的成對測試。

## 造型與材質選擇

本輪改的是 **真實幾何結構 + Vertex Colors**，不是繼續刻槽，也不是透明髮片。

- 檢查 R6c 細分網格後，移除昂貴的上半部凹槽細分，使用其已保存的 R6b 前細分拓樸作核心。核心完整保留頭皮遮蔽、前額髮線與既有下段。這是替換 R6c 上層成本，沒有把舊細分殼與新束同時堆疊。
- 五個手工配置的曲線引導：側掃前束、太陽穴束、左後束、中央後束、右後束。每束有凸形橫截面、閉合體積、收窄末端及根部埋合；與核心合併為一個 skinned mesh。每束 130 頂點、256 triangles。不是五個新增 draw calls，也不是五張平面卡。
- 原本單一不透明材質維持不變；核心上部略降明度形成內層，覆蓋束使用蜂蜜金／自然金／較深金，根部與底側平滑變暗，部分凸面有淺金高光色帶。沒有新增貼圖、燈光或 shader。
- 前兩束固定在 crown；三個後束末端借用鄰近既有權重。沒有新增骨骼、風場、物理或逐幀控制。既有 25 骨／18 個 Spring 關節、wild 力、人物動作、鏡頭與 DPR 皆不改。

## 視覺判斷／本輪停止點

45° 近看可以區別五束的體積與金色色階，原本大片高光被分段；髮型成本明顯降低，下段依然飄動。沒有在檢查視角看到新的露頭皮／頸肩洞口。

**正常 8m 追車距離的提升仍有限，不能宣稱已清楚達成五束可讀的美術目標。** 目前主要增加幾段較寬的金色亮暗塊；背面近看個別束根與覆蓋邊緣仍有「貼附於核心」的感覺，交疊及柔順程度尚待驗收。這不是只改顏色，但閉合立體幾何也不自動等於自然美感。

依 Issue 停損條件，本輪到此交付，不再堆髮片、增加框架或無限微調。若使用者／Julia 判斷追車改善不足，下一步需要另行決定分線、外輪廓與束根交疊的造型調整，而非繼續增加本輪細分或亂流。

## 實際成本

|項目|R6c v0.10.22|R6d|
|---|---:|---:|
|髮型 triangles|7,424|3,559（−52.1%）|
|render vertices|4,376|2,242（−48.8%）|
|GLB bytes|295,944|153,240（−48.2%）|
|材質／mesh|1／1|1／1|
|髮型實際主畫面 draw calls|1|1|
|同 HUD 14000m 場景 draw calls|120|120|
|同場景 triangles|585,560|581,695|

場景數字是同一靜止位置一次實際 renderer 計數，詳見 [render-costs.json](render-costs.json)，不是全賽道／陰影各 pass 的固定上限。GPU 蒙皮與三角形工作量降低；Spring 求解關節數不變。沒有以桌機錄影 FPS 推論手機效能。

ADB 裝置列表為空，沒有可用 Pixel 8，因此本輪未量測手機 FPS。以前 R6 的 Pixel 8 效能退步仍未解決，R6d 不是公開發布就緒版本。

## 測試與回退

`npm run verify:dev` 一次完整執行通過：production build 成功，**115 個測試檔／506 個測試通過**。Vite 既有大 bundle 警告仍在。成對測試確認既有骨骼軌跡相同，原下半部位置／法線／顏色／權重不變；新增五束為閉合非零體積，skin 有效且歸一；一個不透明 mesh，面數／bytes 有界。實際遊戲錄影無 page error。工程 PASS 不等於美術驗收 PASS。

- [新 R6d wild](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild)
- [R6c v0.10.22 對照](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild&hairStyle=r6c)
- [已保存 R6b](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild&hairUpper=old)

`hairStyle` 僅 dev 生效；既有 `hairMid=old` 和載入失敗 fallback 保留。兩個舊 GLB 均未修改。`src/blonde-spring.ts`、`src/cabin-wind.ts`、人物與場景程式無變更。

## 可重現素材

`scripts/blender/export_r6d_locks.py` 是本輪離線造型腳本，含五條明確曲線與色彩配置，無新遊戲依賴。執行：`blender -b -P scripts/blender/export_r6d_locks.py -- public/assets/characters/coast-blonde-r6d.glb`。本機 Blender 4.5.13 已實際執行，另存可編輯 mesh／skin：`C:/astra-dev/outrun/art-prototype/output/r6d-cover-locks.blend`（本地忽略目錄）。原始高模不動。

新版 GLB SHA-256：`8273FE14B4F1C83A4C8B574BACD7D834A6142380013E6E8EBB6F7B447399F519`。

錄影重現：5194 dev server 啟動後，依序執行 `node docs/art-review/r6d/capture.mjs before`、`after`，再執行 `node docs/art-review/r6d/package-evidence.mjs`。先完成 build／版本修改，再錄影，避免 Vite 熱更新打斷驗收頁。需要現有 Chrome、Playwright、ffmpeg 與 ImageMagick。
