# COAST R8.6：連續金色稻海

版本 `v0.9-coast-r8.6`，整合進一般海濱旅程，保留原追車鏡頭與駕駛行為。

- 原稻株只有約 0.5m 寬，近景株距 1.5×2.4m，加上全模型減面破壞分離穀粒，容易留下細棒與裸地。現在從原始成熟稻株辨識莖與穗，先保留穀粒群的封閉輪廓再減面，近景合併兩份植株為約 2.75×1.84m 的稻叢；穗頭有兩節體積、略微下垂，維持黃金色、黃綠葉與深金色變化。
- 近景 384 triangles／群，中景 80 triangles／群。原始 2,268 triangles 模型、原稻草人與授權資料均保留，沒有手刻替代模型。製作工具為 Three.js ConvexGeometry、SimplifyModifier、GLTFExporter，離線產生 GLB；執行時沿用 GLTFLoader 快取。新兩份稻株 GLB 合計 64,132 bytes。
- 五層田面沿用原地形高度，在作物約 0.8m 高處增加持續存在的低面數冠層。每田塊一個不透明 draw，不用透明卡片堆疊；隨原 Chunk 卸載，保留田中央稻草人與裸露小徑。近、中景模型淡出後仍有金色體積，最寬田區維持從道路旁 20m 延伸至右側 252m。橫向田間路由 4m 縮至 2m；灌溉渠與梯田緩坡保留。
- 稻叢沿用 three-stylized 的世界座標 GPU 風動，再加入共同的慢速大範圍波紋。冠層與穗頭共用三種尺度的風場與時間，波紋在田塊之間連續；沒有 CPU 逐株動畫。花田風動、數量、模型與布局維持原狀。

素材：[Rice Mature（CC0）](https://3dassets.dev/assets/cozy-farm-and-homestead-rice-mature-28d8a6a5)、[Scarecrow（CC0）](https://3dassets.dev/assets/medieval-mmo-starter-realm-scarecrow-64081717)、[three-stylized（MIT）](https://github.com/Steve245270533/three-stylized)。本地授權見 `public/assets/coast-farm/LICENSE.md` 及 vendor MIT 聲明。

## 驗證

正式建置通過；88 個測試檔、280 項通過，沿用既有四個歷史測試排除。新增檢查涵蓋模型面數／實際立體尺寸、田面高度、至少 98.5% 冠層覆蓋、稻草人中央通道與每田塊三角形預算。

91 個農田／花田田塊全部常駐時：稻株群從 20,075 降至 11,001（含兩個 LOD，減少約 45%），草葉從 73,402 降至 28,550，花朵仍為 45,403、稻草人仍為 6 個。新增冠層合計 100,888 triangles；這些是完整常駐數量，不是每幀同時可見數量。

一般旅程以約 234 km/h 連續行駛、進入都市並重玩：[完整記錄](evidence/coast-r86/final-drive/drive.json)。7,797 個有效幀，P95／P99 16.8ms，最長 33.4ms，≥50ms 長幀 0（排除截圖期間）。主稻田路段全場景 220–278 draw calls、445,167–806,163 triangles；整段海濱最高 361 calls／862,750 triangles。沒有頁面／shader 錯誤、off-road 或重複 GLB 下載；都市農田／船隻皆歸零，重玩恢復初始 67 田塊與 14 艘船。初始 ready 6.15 秒，包含本機素材載入、分區生成及 GPU 預熱，不能視為手機網路載入時間。

同里程靜態追車比較見 [修改前](evidence/coast-r86/before/views.json) 與 [修改後](evidence/coast-r86/views/views.json)：2425m 的全場景 calls 186 → 210、triangles 647,479 → 709,368；2640m 為 260 → 274、684,759 → 719,748。每個可見稻田額外一個不透明冠層 draw，換取持續的密集外觀，沒有假稱零成本。

正常高速追車截圖：[稻海入口](evidence/coast-r86/final-drive/moving-2425.png)、[主稻田與遠方山腳](evidence/coast-r86/final-drive/moving-2640.png)、[田中央稻草人](evidence/coast-r86/final-drive/moving-2850.png)、[後段稻田](evidence/coast-r86/final-drive/moving-6000.png)。花田截圖 [3210m](evidence/coast-r86/final-drive/moving-3210.png) 保留作為非目標景觀回歸檢查。

[8 秒風動錄影](evidence/coast-r86/wind/rice-waves.webm) 使用原追車鏡頭、停車觀察，只在測試頁隔離交通碰撞以防車被推走；不是新增遊戲模式。測試確認前後相機位置完全相同，田面 ROI 平均 RGB 變化 9.41／255，約 72% 像素變化大於 3，證明動畫不是靜態貼圖或相機移動；詳見 [wind.json](evidence/coast-r86/wind/wind.json)。最後微調冠層與穗頭的上下位移同相，並重新完成 shader／建置及風動檢查。

所有效能數據與截圖為 **桌機 Edge、觸控及解析度模擬，並非實體 Pixel 8 實測**。實體 Pixel 8 的持續 58–60 FPS 仍待主人確認。

手機與 PC 同一 AP 時開啟 [本地遊戲](http://192.168.1.106:5180/)，右上角版號 `v0.9-coast-r8.6`。提交推送 `dev`，不晉升 `main`。
