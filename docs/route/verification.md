# R0 驗證紀錄與歷史 R1 搬移建議

**歷史紀錄：R0 資料與工具已交付，R1b 已於後續驗收。** 本次版本化現況並提供離線檢查。現役道路、遊戲行為及場序沒有變更。

## 重現與核對

於 repo 根目錄使用既有 Node / 專案相依執行：

```sh
node scripts/route/export-coast.mjs
node scripts/route/export-coast.mjs --check
node --test scripts/route/check-connector.test.mjs
node scripts/r5-export-road-guide.mjs
```

Windows 已有私人 preview 設定的環境另跑既有 `npm run verify:dev`。路線匯出本身不使用模型、私人貼圖、瀏覽器或 GPU。重建時以最後涉及 `src`、`content`、lockfile 的 Git revision 和 author date 標註資料來源；這些輸入有未提交變更時拒絕賦予來源版本。文件的提交可以晚於幾何來源。CSV 保存 8 位小數精度，輸出比對接受 Git checkout 的換行轉換。

| 核驗 | 結果與界線 |
|---|---|
| 幾何來源 | Windows dev `023cb5469945bcb83fda7be1acda5ab4d804bfdd`，2026-11-20。Bare page 先 `configureKentingCoast()` 再 `coastWorkerRoad()`；Worker 的 init 在自己的模組狀態中作相同配置；岸線烘焙也取啟用後的 track。R5 的舊匯出遺漏配置，現已修正 |
| Chrome 正常入口 | 在隔離 loopback、獨立 Chrome 開普通首頁並選開始遊戲。比對遊戲 QA 的 `__drive.sample(d)` 與 CSV，在同一頁已初始化的實際 road Worker 模組另以同一 factory 取樣。兩端各 2,841 站、包括首末、海灘及外段，與離線表的中心線最大差均 0.000000951 m 以下。頁面航向差低於 0.000000287°，曲率差低於 0.000000005 m⁻¹，路寬與車道數相同。這比較的是取樣器，不是每塊串流三角面的逐頂點比對 |
| 另一條工具鏈 | R5 匯出 737 站，與 CSV 共同站的中心位置最大差小於 0.000000009 m。採用相同運行設定，輸出仍供現有離線美術工具使用 |
| 成品與可讀性 | SVG 在 Chrome 以原尺寸 1360 × 1130 渲染並檢視。兩欄編號對照密集景點，剖面共用 HUD 軸；文字包圍盒均在圖框內。SVG、CSV、JSON 重新計算皆一致 |
| 驗證 | Connector 六個離線測試覆蓋三種狀態、無證據、航向回繞、太陽、海平面／碰撞、垂直和長度不足、實際核心草案。既有 scenic check、scenic test、TypeScript/Vite build 及 138 檔 578 個單元測試通過。實際跑的是私人 preview build，未作公開發行或實機認證 |
| 仍須實證 | 新擺位的塔和日輪是否同時可讀、A6 接新入口的視距、坡頂輪胎接地、海岸幾何／水罩及碰撞重合程度均為 UNKNOWN。這些需要新布局存在後試駕；R0 沒有建造這種布局 |

本次檔案集中在 `docs/route/`（本文、README、Connector 規格、主圖、路線 CSV、墾丁 ports JSON）、`scripts/route/`（匯出、繪圖、純判定、測試）和既有 `scripts/r5-export-road-guide.mjs`。發表範圍不含任何遊戲資產與執行期檔案。SVG 使用 LF 時 SHA-256 為 `13721f00637738078f93ddb36fefc9d6dc3381795323c87faba4d6a1f3c42bbf`。

## R1 最小施工提案

維持候選順序 **Tutorial → Connector → Kenting Beach → Connector → Working Harbour → Connector → Coastal Woods**。港、林仍未定 port，沒有資料支持為二者決定精確里程或正式長度。

1. **先在原址重播。** 將提案的海灘局部座標與核心安裝回現址，其他內容保持基準。首要工作是把 4738 的首個活動群、3950 開始影響的山、6500 後的岸形接回納入明確責任。每 5 m 比對中心線、橫剖面與護欄，逐段核對預烘水線、陰影、塔腳、泳客水位及交通排除區，保留 A0–A6 與街機速度。估計 1–2 工程日，取決於絕對站號散布及 source fingerprint。
2. **只搬一次完整海灘。** 在可撤回的布局選一組相鄰 port，保住固定太陽、轉彎前預告、左側海景、尾塔；只製作該案例實際需要的前後接縫。先以端口篩不可能的長度，再用內部曲率／垂直剖面與 100、200、250 km/h 情境檢查，對接處加密採樣。舊場址不得殘留陰影、樹洞、隱形碰撞或重複活動。估計 2–4 工程日；最大的變數是出段基底變形、世界岸線遮罩和原山形與 A6 共用。
3. **實際正常追車、串流和競速回歸。** 核對冷進場、Worker 邊界、恢復、起終點、AI 及交通。對照進場遮蔽、出彎、游泳區和主塔；海岸在左、塔在位，不等於日輪未被遮住。估計 1–2 工程日；可玩證據成立後再請 Michael / Julia 驗收。上述是首個切片的粗估，不含漁港／樹林資產製作與裝置認證。

**延後抽象化。** 建立第二個真實案例前，沿用現有路面取樣介面、資產批次與手動 Connector；暫不建立通用世界圖、曲線生成器或最佳排列器。Harbour 的靠岸作業面、Woods 的林緣／遮蔽及各自長度要由下一輪視線設計獨立決定。

**未來 Stage Composer 的輸出。** 對每個 Segment 與 Connector 列順序、局部站號長度、起迄里程、預期速度帶、時間帶和視覺／競速節奏（教學、預告、揭景、壓力、喘息）。**總站號長度 = 所有 Segment 長度之和 + 所有 Connector 長度之和**。若實際世界弧長不同，另列供施工。估時對每段以局部速度積分，再加預計的減速／交通影響；不要把全程長度除以最高車速當作完賽實測。14,200 m 僅為本圖所記錄的歷史現況，契約不設全關長度上限。
