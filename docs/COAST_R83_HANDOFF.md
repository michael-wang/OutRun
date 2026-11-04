# COAST R8.3：觀光農田

版號 `v0.9-coast-r8.3`，直接整合一般海濱旅程。道路里程 2,400–3,000m 是金黃稻田，3,100–3,600m 是黃／粉紅／紫色花帶，前後留出草地過渡至既有丘陵。取消原 2,300–3,350m 的住宅區，下一段夜市從 3,900m 才開始；其餘住宅與夜市保留。無新模式或 UI，未修改操控、道路生成、Ultra-Water 核心。

## 素材與整合

- [three-stylized](https://github.com/Steve245270533/three-stylized)，MIT，固定版本 `8eb0dde5a8e7eae985d69f923b627b0cf253bed5`。只引入 grass 模組及相依程式，實際使用 Grass、InstancedMesh、Wildflowers、GPU wind、External Surface 與 Coverage sample mask。完整 MIT 聲明放在原始碼及公開素材目錄。未引入 React、R3F 或新 renderer；其 Terrain 是 facade 的相依檔案，沒有執行它的地形生成。
- [Rice Mature](https://3dassets.dev/assets/cozy-farm-and-homestead-rice-mature-28d8a6a5)，CC0。研究 Quaternius Ultimate Crops 與指定稻株後，選用後者的稻穗造型。原始 2,268 triangles，離線用 Three.js SimplifyModifier 簡化為近景 184、中景 44 triangles，烘焙頂點色、合併材質，保留原件與重製腳本。不是手刻稻株。
- [Scarecrow](https://3dassets.dev/assets/medieval-mmo-starter-realm-scarecrow-64081717)，CC0，原始 GLB、430 triangles。放置於 2,470、2,680、2,900m；中間一個位於田內裸土小徑。高度約 3.28m，適度加寬、調亮木架與草帽材質，沒有改造模型或加入骨骼、碰撞。
- 花朵使用上游 Wildflowers 的原始花形遮罩，依田塊分配固定色系，並調整亮度以融入黃昏。沒有使用向日葵參考模型，也沒有新增植被框架。
- 三個執行時 GLB 合計 56,724 bytes（55.4 KiB），全部由本站 GLTFLoader 載入。兩個 3dassets 原件的來源標示 AI generated，原始 API 資料、CC0 聲明與 SHA-256 已保留於 `public/assets/coast-farm/`。

## 地形與成本

33 個田塊全部在距道路 20–84m 的既有平原上，依實際彎曲道路座標及 `coastNatureGround` 對原始地表三角形取高度；沒有把農田鋪上陡坡，也沒有另造梯田或改掉丘陵。固定 Seed，行列略有擾動，Coverage mask 留出行距、邊界及稻草人小徑。既有高樹／灌木僅在這段農田平原避讓，後方山坡植被保留。

近處使用簡化稻株與 Grass 葉片、Wildflowers 花形及輕微 GPU 風動；較遠處降低稻株密度、換低面數模型；最遠只留田塊底色與行列紋理。植株用距離漸隱與逐田塊視錐剔除，花朵是 alpha-test／depth-write，無透明混合、動態陰影、新燈光或後製。田面、田埂、小徑與不反射的淺水渠合併成每田塊一個 Draw Call。

所有田塊位於初始 5km 串流配置窗內。上游植被建立工作透過既有 StreamedScene 分批任務執行，出發載入畫面等待田塊準備好，避免途中建立植被的 CPU 尖峰。另沿用章節準備的微小 framebuffer 提交方式，逐物件預熱遠處植株 shader、geometry buffers 和花形貼圖，避免第一次看見作物時才編譯。田塊按既有 1km Chunk 擁有／退休，卸載時釋放 instance buffers、專屬幾何、花形貼圖與材質；重玩只重建 GPU 資源，共用已下載的 GLB bytes。

## 驗證

- 正式建置通過；沿用既有四個歷史測試檔排除設定，87 檔、277 項測試通過。新增平緩地表、唯一 Chunk 歸屬、建物避讓、三稻草人與模型面數／本地資源檢查。
- 首次完整出發準備約 3.75 秒（包含 GPU 預熱）（本機伺服器、桌機 Edge）。三個 GLB 各請求一次，完整旅程及重玩仍合計三次；無頁面或 shader 錯誤。
- 完整高速行駛海濱 → 都市 → 既有「重新開始」：田塊 33 → 0 → 33，稻草人恢復為 3 個，無 off-road。5,000m 後田塊已隨 Chunk 退休；沒有跟著鏡頭重新生成。
- 全農田配置共 29,728 草葉、22,913 花朵、7,335 稻株模型 instance（含近／中 LOD 表示）、3 個稻草人。它們不會全部同時送繪；農田區高速取樣約 3,557–20,655 個 instance 被提交，這是 mesh 提交數，不是逐植株可見像素數。
- 高速稻田取樣：整個主畫面 168–250 Draw Calls，約 44–66 萬 triangles；其中農田最近 100ms 提交 31–62 draws。花田取樣：整個主畫面 234–249 calls，約 33–37 萬 triangles；其中農田 6–33 draws。主畫面統計不包含 Ultra-Water 等離屏 pass；離屏與完整幀成本另見 soak 記錄。
- 完整旅程 8,493 幀，P95／P99 16.8ms，最大 16.9ms，≥50ms 長幀 0；截圖期間不納入。記錄：[drive.json](evidence/coast-r83/final-drive/drive.json)。
- 不截圖測試曾在約 1,980m、稻株第一次顯示時出現一次 50.1ms 長幀；加入出發前 GPU 預熱後，相同 70 秒路線共 4,199 幀，P95／P99 16.8ms、最長 16.9ms、≥50ms 長幀 0，農田段每秒取樣 60 FPS。這項修正沒有新增後製或增加正常行駛的離屏 pass。[修正前](evidence/coast-r7/performance/r83-farm/soak.json)、[修正後](evidence/coast-r7/performance/r83-farm-warm/soak.json)。

以上全部是**桌機 Edge 手機觸控／解析度模擬**（960×432 CSS、DPR 2.75），不是實體 Pixel 8 測試；實機 58–60 FPS、溫度與長時間穩定度仍待使用者驗收。

行駛中截圖：[稻田](evidence/coast-r83/final-drive/moving-2425.png)、[田內稻草人](evidence/coast-r83/final-drive/moving-2640.png)、[接近稻草人](evidence/coast-r83/final-drive/moving-2870.png)、[花田](evidence/coast-r83/final-drive/moving-3210.png)。完整模型與效能摘要：[summary.json](evidence/coast-r83/summary.json)。

同一 AP 手機試玩：[本機遊戲](http://192.168.1.106:5180/)。開一般旅程即可，沒有額外切換；右上角應顯示 `v0.9-coast-r8.3`。僅更新 `dev`，不推廣至 `main`。
