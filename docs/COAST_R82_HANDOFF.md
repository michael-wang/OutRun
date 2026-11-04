# COAST R8.2：四艘沿岸裝飾船

版號 `v0.9-coast-r8.2`。直接加入一般海濱旅程，沒有新增展示模式、選單、互動或航海物理；道路、操控、Ultra-Water 核心及既有手機品質設定不變。

## 模型來源

- 兩艘白帆船：Kenney Watercraft Pack 的 `boat-sail-a.glb`，使用原始模型與 palette 貼圖。官方頁：[Watercraft Kit](https://kenney.nl/assets/watercraft-kit)。官方下載回傳 403，因此取用 [Kenney 本人在 OpenGameArt 發布的版本](https://opengameart.org/content/watercraft-kit)，包內授權標示 2.0／CC0。
- 兩艘白色動力遊艇：使用者指定的 [Flybridge Yacht](https://3dassets.dev/assets/transport-collection-hd-flybridge-yacht-0ead6003)，原始 GLB、CC0，具船艙與上層駕駛台。來源將此素材標示為 AI generated，該資料保留於 provenance。
- 沒有手工製作船體，也沒有轉檔或重建幾何。執行時僅調整比例、吃水、朝向、霧面材質與少量環境補色。下載原件、授權、SHA-256 與來源紀錄均在 `public/assets/coast-boats/`。
- 兩個 GLB 加一張 palette 共 370,782 bytes（約 362 KiB）；遊戲只讀取本站檔案，不依賴外站。

## 海岸配置與動畫

四艘船分布於道路里程約 1,850、2,370、6,020、8,640m 的海域。配置透過既有道路取樣與 `coastBeachX` 海岸剖面轉換，不假設道路是直線，也不將船固定在玩家前方。

白帆船與近處遊艇較醒目；另一艘帆船與遊艇較遠。巡航沿海岸座標形成小型閉合路徑，無里程重置／瞬移。使用既有 `COAST_SEA_LEVEL` 與個別吃水深度，搭配小幅升沉、慢速 Roll／Pitch 與相位差。Ultra-Water 的 FFT 位移保留在 GPU，沒有 CPU 波高查詢介面；此版依使用者允許的替代方案使用視覺浮動，**不是逐波精確浮力**，沒有 GPU 回讀。

正常駕駛取景：[主要帆船](evidence/coast-r82/final-views/driver-1550.png)、[主要遊艇](evidence/coast-r82/final-views/driver-2250.png)、[遠帆船](evidence/coast-r82/final-views/driver-5500.png)、[遠遊艇](evidence/coast-r82/final-views/driver-8050.png)。近處遊艇已依駕駛鏡頭移離夕陽主反射帶。

## 資源與驗證

- 全場只有四艘船，共用兩種模型的幾何／材質，總計 14,164 個三角形，全部可見時最多 18 個模型 draw calls。無新增動態陰影、燈光、後製或框架。
- 在出發前完成本地 GLTFLoader 載入，整段海濱共用同一組四艘船；遠距離使用既有霧與視錐剔除，不跟地景區塊反覆生成。離開海濱沿用現有環境淡出與 sceneDisposal；重新出發使用快取的原始 GLB bytes，避免重複下載與快取已被釋放的 GPU 物件。
- 地形測試涵蓋兩小時巡航取樣：以實際彎曲岸線的最近路段檢查完整船體仍離岸超過 25m，位置連續且速度低；另驗證兩帆船／兩遊艇、模型格式、本地貼圖與面數預算。
- 建置通過；沿用既有 CI 的四個歷史測試檔排除設定，86 檔、275 項通過。截圖驗證一般旅程入口，無頁面／shader 錯誤，兩個 GLB 各請求一次。

- 連續高速駕駛通過四艘船並完成海濱→都市，再使用既有「重新開始」回到海濱：全程四艘、離開後 0 艘、重開後 4 艘，兩個 GLB 合計仍只有兩次請求。P95／P99 16.8ms，最長 16.9ms，超過 50ms 長幀 0 次；測試刻意排除截圖期間的幀。無頁面／shader 錯誤、取樣 off-road 0。記錄：[drive.json](evidence/coast-r82/drive/drive.json)、[摘要](evidence/coast-r82/summary.json)。
- 行駛中截圖：[白帆船](evidence/coast-r82/drive/moving-1550.png)、[白遊艇](evidence/coast-r82/drive/moving-2250.png)、[遠帆船](evidence/coast-r82/drive/moving-5500.png)、[遠遊艇](evidence/coast-r82/drive/moving-8050.png)。

以上為桌機 Edge 的手機觸控／尺寸模擬，並非實體 Pixel 8 的 FPS 保證。實機維持約 60 FPS 及最終視覺感受仍待使用者驗收。

本機網址：[遊戲](http://192.168.1.106:5180/)。本次只更新 `dev`，不推廣至 `main`。
