# 海濱公路 R7 — 夕照海灣與自然丘陵

2026-11-04。由 `dev` 的 `eb67cf2` 開始，依本次海濱優化要求實作。遊戲識別為 `COAST-SUNSET-R7`，fingerprint 為 `coast-sunset-hills-r7-804`。等待人工駕駛與實機手機驗收；不代表已獲准升級 `main`。

## 駕駛視角與路線

海岸採用反覆經過岬角、再打開海灣的走向。沒有照搬草圖的急彎：過大的轉向會把固定夕陽甩到側後方。四段海灣讓夕陽保持在追車鏡頭左前方約 21°，中間的緩彎提供離開、再看見夕照的節奏。太陽、海面反射方向與追車鏡頭沒有跟著玩家旋轉來製造效果。

實際追車截圖（手機比例瀏覽器模擬）：

| 路線座標 | 畫面 |
| --- | --- |
| 1,250 m | [第一海灣](evidence/coast-r7/mobile-1250.png) |
| 4,450 m | [第二海灣](evidence/coast-r7/mobile-4450.png) |
| 6,500 m | [第三海灣](evidence/coast-r7/mobile-6500.png) |
| 9,200 m | [末段夕照](evidence/coast-r7/mobile-9200.png) |

以上座標含原有 350 m 起跑偏移。實際道路總長仍為 10 km。住宅、夜市、海灘活動的位置保留；只調整本海濱模式的平面彎道。駕駛物理、道路寬度、輸入控制、其他關卡及既有人工評語沒有修改。

## 地形與資源

- 使用 [ProceduralTerrains](https://github.com/ZyFou/ProceduralTerrains) 的原始 `cpuNoise.js`：旋轉域 FBM、侵蝕／扭曲參數與 ridged noise，搭配本專案的道路退縮和聚落遮罩，產生前後兩層實際隆起的丘陵。MIT 授權與來源 blob 保存在 `src/vendor/procedural-terrains/`。沒有整包引入編輯器或其雲、水、後製系統。
- 地形在既有 Worker 中生成，近側 5 m、外側 20 m 縱向網格，並增加橫向坡面取樣。村落前庭與路肩保持原高度，樹根以實際地形三角形插值定位。
- 模型來自指定的 [Quaternius Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html) 免費 Standard 版（CC0）：CommonTree_1、CommonTree_3、Pine_5、Bush_Common、Grass_Common_Short、Rock_Medium_2。來源 SHA-256 與授權隨資源提交。秋葉灌木改為海濱綠色。
- 建置直接使用已提交的處理結果，不需要手機或 CI 下載整套約 104 MB 原始素材。重製素材時，以原始 Standard 解壓目錄執行 `node scripts/prepare-coast-nature.mjs <directory>`；此離線美術步驟需要 ImageMagick。

## 行動裝置成本

植物按 200 m 區段及模型／材質使用 `InstancedMesh`。6 張 512×512 貼圖共 666,411 bytes，模型資料 1,556,963 bytes；材質共用，整段行駛保持 7 個自然景觀材質。樹幹已離線減面，近景樹木為 1,277–3,370 三角形，遠景為從原模型輪廓生成的 144–150 三角形封閉網格。

樹木在區段中心距離 600 m 切到簡模，1,800 m 外隱藏；灌木、草叢與石頭的顯示距離分別為 420、260、650 m。這是區段級 LOD，不是每棵樹獨立 draw call。近景以透明裁切呈現葉片，遠景不用透明葉片。植被沒有即時陰影，也沒有加入體積光或額外後製。貼圖載入完成後才允許開場；卸載海濱時釋放共用貼圖。

## 驗證結果

- `npm run build`：通過。正式版本機預覽中，模型與 6 張貼圖全部 HTTP 200，無頁面錯誤，沒有曝露開發用 `__drive` API。
- 完整單元測試：270 通過、6 失敗。6 項均在修改前 `eb67cf2` 的隔離來源副本重現；它們位於既有 CI 已標示為歷史相容性檢查的四個測試檔，涉及舊操控常數、版本指紋與缺少的 `docs/evidence/v0.7a/capture-index.json`。沒有修改舊驗收值來讓它們通過。
- 本次地形、海岸遮罩、串流、章節和連接道路相關測試：22 通過。涵蓋四段朝向、道路與前庭高度、真實丘陵高度變化、植被根部與渲染地面的誤差 < 0.08 m、配置重現性、簡模面數、共用貼圖、貼圖就緒、LOD 切換和釋放。
- 完整海濱自動駕駛：103.0 秒到達終點，遙測 off-road 為 0；103 個一秒取樣無缺少當前／相機道路、無串流暫停、無頁面錯誤。接地誤差最大約 0.0026 m。P50 / P95 / P99 為 16.7 / 16.8 / 16.8 ms，最差 17.0 ms，≥50 ms 為 0。總 draw calls 為 117–370；自然景觀啟用批次為 3–46。
- 一般遊戲入口的觸控油門按下與放開通過。海濱轉都市完成，速度保持、heading 誤差接近 0，轉場後自然景觀實例為 0，無頁面錯誤。

上述測試使用桌機 GPU 的 headless Edge、960×432 觸控／手機 viewport 模擬。幀時間不是實體手機成績，一秒取樣也不能排除所有短暫現象。完整駕駛記錄在最後加入貼圖開場等待與末段不足整塊網格的取樣修正之前；最終版本另外通過完整單元、建置、正常入口及轉場驗證。未宣稱實體手機持續效能、真實手感或人工美術認可。

提交的精簡證據：[summary.json](evidence/coast-r7/summary.json)、[integration.json](evidence/coast-r7/integration.json)、[production.json](evidence/coast-r7/production.json)。完整本機自動駕駛與測試原始記錄保留在同一資料夾，既有截圖與人工評語檔未變動。

## 本機試玩

在 repository 執行 `npm run dev`，一般首頁就是海濱 → 都市 → 峽谷的旅程。單獨驗收海濱可使用 `/?showcase=coast`。請以實體手機駕駛四個海灣與自然路段，確認夕照可見性、山丘尺度、樹葉密度與持續效能。
