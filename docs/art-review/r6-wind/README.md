# R6 Spring Hair — 誇張乘客艙風場實驗

2026-11-14，dev 0.10.21。依使用者本輪指示，效果優先、暫不以 Pixel 8 FPS 阻擋；這輪不是 Issue #46 的 Morph 回退施工。美術效果待 Julia／使用者驗收。

## 實際遊戲影片

三片各約 22 秒，原生 1600×900、DPR 1、正常 8m 追車鏡頭，未放大角色、未改鏡頭或遊戲解析度策略。桌機 Chrome／RTX 5070 Ti 實際 WebGL 畫面，非 Blender 預渲染，非 Pixel 8 錄影。

- [baseline.mp4](baseline.mp4)：原本 R6 Spring 風力。
- [dramatic.mp4](dramatic.mp4)：較柔順、較容易維持造型。
- [wild.mp4](wild.mp4)：本輪最接近「很亂但仍有型」的強風目標。

每片順序相同：靜止 → 60 → 80 → 120 → 300 km/h 直線 → 約 280 km/h 左彎 → 右彎 → 煞車至靜止、回穩。片底標籤顯示實際車速與 HUD 公尺。各狀態間直接切換到相同測試位置，不是全程連續駕駛；煞車片段則直接接續右彎，沒有重設頭髮。

|狀態|起始 HUD 位置|目標速度|
|---|---:|---:|
|靜止、60、80、120|14000m|0／60／80／120 km/h|
|高速直線|13910m|300 km/h|
|左彎|3305m|280 km/h|
|右彎|4000m|280 km/h|
|煞車回穩|接續右彎|280 → 0 km/h|

相同 `trafficSeed=42`、路段、控制器、場景光線與錄影尺寸；各次實際瀏覽器幀時序並非逐幀鎖定。錄影頁暫停隨機超車歡呼觸發，以免手／頭動作影響比較；正式遊戲歡呼與身體動作未更動。

## 結論與限制

**風場確實是重要瓶頸，但尚不能判定是唯一或主要瓶頸。** 只改風場，原本 300 km/h 接近固定後掠的髮尾就能持續活動，80 km/h 也有更清楚的風感。這證明目前 Spring Bones 能對分頻、分髮束的風力作出不同步的反應，並非完全吹不動。

`wild` 的風感最明顯；`dramatic` 的柔順與輪廓控制較好。`wild` 高速右彎偶爾局部捲得太急（單關節峰值約 112°），目前保留作為實驗上限，不宣稱已達到最終美術品質。頭頂固定權重未動，沒有整個髮冠亂抖；中後段的厚髮束仍可見成團、扇狀的輪廓，尚未呈現細長髮尾的絲滑感。增加風力不能自動改變這種幾何／蒙皮觀感；本輪沒有擅自翻修模型。

從各片排除前 0.5 秒後，六個末端關節的「相對靜止姿勢角度」時間範圍：

|模式|80 km/h|120 km/h|300 km/h|
|---|---:|---:|---:|
|baseline|11.5–11.8°|12.0–12.4°|3.4–3.6°|
|dramatic|25.4–31.6°|24.3–38.5°|14.6–18.6°|
|wild|20.8–29.5°|14.6–34.6°|25.1–39.8°|

這些數值是角度大小的最大值減最小值，不是方向軌跡、自然度評分或頻譜證明；較強風也不保證每一條髮束的角度範圍都更大。完整摘要在 [measurements.json](measurements.json)。其中 `peakRestDisplacementPixels` 是採樣頂點相對同鏡頭靜止網格的投影差，包含平均後掠，不能當作時間擺動幅度。

輔助局部連續影格（僅診斷時裁切放大，不代替正常鏡頭影片）：[dramatic 120](dramatic-detail.jpg)、[wild 120](wild-detail.jpg)、[wild 右彎](wild-turn-detail.jpg)。

## 最有幫助的參數

- 低速能量用 `tanh(speed / 18 m/s)` 提早建立，避免必須到極速才開始有感。`wild` 強度為 `dramatic` 的 1.65 倍。
- 後向主風疊加約 0.32 Hz buffet、約 1／1.6 Hz 亂流與回捲，打破長時間固定後掠；髮尾另有約 4.3–6.6 Hz 小幅 flutter。皆為連續正弦調變，不使用每幀亂數。
- 六條髮束各有 phase、amplitude、時間偏移與 18–85 ms 平滑延遲，避免同相位搖擺。
- 沿骨鏈增益為 0.34／0.83／1.15，第一活動關節仍限幅 0.85；固定頭頂不變。改強中後段比整顆頭同時增強有效。
- 過彎左右反向增減最多約 32%，減速增加短暫向上／前方回捲，尾流以 0.38 秒衰減。這是局部乘客艙美術力，不改全場海風或車輛物理。

## 實作、重現與回退

保留原 R6 GLB、25 根骨骼、18 個活動關節、2,279 triangles、原蒙皮、彈性、阻尼與頸部碰撞。GLB SHA-256：`F20FEFE1A0DEBA703E7F298FF50E07E277950EF06C7C194A8D8730CD0512555B`。男女主角 scale 皆為 `[1,1,1]`。沒有增加模型、材質、draw call、透明髮片或動態光源；增加的是每個活動關節的分頻運算與平滑狀態。未測本輪手機 FPS，也沒有宣稱無 CPU 成本。

開發伺服器可玩連結（重新載入即切換）：

- [baseline](http://192.168.1.106:5194/?at=13910&trafficSeed=42&hairWind=baseline)
- [dramatic](http://192.168.1.106:5194/?at=13910&trafficSeed=42&hairWind=dramatic)
- [wild](http://192.168.1.106:5194/?at=13910&trafficSeed=42&hairWind=wild)

移除 `at` 從頭遊玩；不帶 `hairWind` 或輸入無效值都用 baseline。此參數只在 Vite dev 生效，production 固定 baseline；既有 `r6=previous` 回退入口未動。

程式修改：`src/cabin-wind.ts` 分髮束風場；`src/blonde-spring.ts` 風力濾波與煞車尾流；`src/runtime-query.ts`、`src/main.ts` 開發參數接線。無新依賴、無新框架、NT$0。

重錄：啟動 5194 dev server，依次執行 `node docs/art-review/r6-wind/capture.mjs baseline`、`dramatic`、`wild`，再執行 `node docs/art-review/r6-wind/package-evidence.mjs`。需要既有 Playwright、Chrome 與本地 ffmpeg。原始影片與逐幀資料留在忽略的 `test-results/r6-wind/`，摘要與交付影片在本目錄。

## 驗證

本地 `npm run verify:dev` 已通過：production build 成功，113 個測試檔、501 個測試全部通過。Vite 仍提示大型 bundle，並非 build failure。新增測試覆蓋連續／分髮束風力、模式解析、頭頂固定、真實 GLB 受風及煞車後回穩。三種實際遊戲錄影均無 page error。這些工程測試不代替 Julia／使用者的美術驗收。
