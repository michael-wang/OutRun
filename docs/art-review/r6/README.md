# R6 整合版 — Issue #45

`dev` 0.10.20 · 2026-11-14 · 基底 `fb52490`

**已整合成可玩版本；尚未通過美術與 Pixel 8 效能驗收。** 這是一份整體前後比較，沒有拆成三個獨立 A/B。NT$0；未修改 main、賽道、AI、車輛物理、Ultra Water、追車鏡頭或 renderer DPR。

## 驗收媒體

- `01-pixel8-r6.mp4`：真正 Pixel 8 USB 螢幕錄影，原生 2400×1080；剪掉測試定位／存圖的等待，片段內不加速。依序靜止、60、80、120、220、300 km/h、左彎、右彎、煞停。
- `02-before-after.jpg`：同一正常追車鏡頭，上為上一版整體外觀，下為 R6；沒有局部放大。
- `03-pixel8-native.png`：最終實機原生螢幕截圖。
- `04-seat-front.jpg`、`05-seat-side.jpg`：遊戲既有開發視角補充檢查座姿與手部，非主要美術驗收視角。
- `measurements.json`、`pixel-previous-perf.json`、`pixel-r6-perf.json`：原始效能紀錄與摘要。
- `capture.mjs`：可重跑的本地實際遊戲擷取腳本。影片使用腳本控制油門／煞車／方向，沒有預烘頭髮動畫或替換遊戲風場；九個情境之間用既有開發定位介面跳轉。僅在擷取頁面隱藏跳轉造成的重複 GO 字樣並加上測試標籤，正式 UI 不變。

## 實作

1. **角色 1.0 scale**：男女主角均為 `[1,1,1]`。維持左右座位；坐墊方向下移 35mm，女乘客向內移 90mm，讓完整尺寸人物在傾身、歡呼、揮手時保有車門間隙。駕駛握方向盤及搭車門的接觸點仍由既有手臂系統控制。
2. **Blender 髮型**：從已核准的 `heroine-hair-motion-study.blend` 複製，不重生成頭部。保留頭頂／瀏海；下緣既有分層髮束局部收細（最大造型位移 27.4mm），中段至末端漸進蒙皮。6 組、每組 3 個動態關節，25 個骨骼含末端，18 個 spring joints。使用獨立 MIT `@pixiv/three-vrm-springbone@3.5.5`，沒有完整 VRM／布料引擎。
3. **敞篷乘客艙風**：`V_worldWind - V_worldCar`，車輛速度取真正的世界座標位移／dt，沒有再次乘 pace。重用 `sampleCoastWind`；轉至車體座標，加入擋風玻璃遮蔽、連續低／中頻尾流及各髮束相位不同的細小擾動。這是美術導向的簡化風場，不是 CFD。側向慣性沿用 occupants 的 sway。

角色繼續用既有 body/head pivots、表情及動作。Spring Bones 固定 60Hz，與車輛 120Hz 模擬分開；延遲最多補 6 步，超過 100ms 直接重置，不追趕長時間中斷。暫停凍結，重新開始／定位重置；退出時釋放各實例幾何、材質與 skeleton。

### 資產與成本

| 項目 | 上一版 | R6 |
|---|---:|---:|
| 髮型三角面 | 979 | 2,279 |
| 完整車輛含 instances 三角面 | 13,871 | 15,171 |
| 車輛 mesh draw 數（主通道，不含陰影重畫） | 59 | 59 |
| 髮型 GLB bytes | 90,340 | 109,144 |
| 材質／透明髮片／新增光源 | 1／0／0 | 1／0／0 |

Spring/controller 獨立打包估算 26,212 bytes minified、7,027 bytes gzip（external Three.js；不是 production bundle 的精確差值）。實際 production main chunk 790.17 kB / gzip 262.31 kB。髮型增加 GPU skinning 與一張骨骼資料紋理；沒有新增透明排序、貼圖素材或渲染 pass。

最終 Pixel 8 進場該 GLB 的 Resource Timing 為 27.8ms，transferSize 300 bytes（HTTP 快取驗證）、encodedBodySize 109,144 bytes。這是快取進場，不代表首次下載或 GPU shader 預熱時間；紀錄在 `pixel-asset-load.json`。

原高模檔案 SHA-256 保持 `DBDBCB743E354143BFBFCE9DF0B74D28E1D48BA809D7300DE4B6D00AC6C6B0CA`。新可編輯副本在 `C:/astra-dev/tools/outrun-hair-spring-ab/heroine-r6.blend`，SHA-256 `01FDF768DF91B1B9DE898D67EA37793CC193BC465E646EBBF5DA7C1AB28DEAFC`。重製腳本：`scripts/blender/export_r6_blonde.py`。正式 runtime GLB SHA-256：`F20FEFE1A0DEBA703E7F298FF50E07E277950EF06C7C194A8D8730CD0512555B`。

## Pixel 8：效能未達驗收

USB 連接實際 Pixel 8 / Chrome 157，沒有手機模擬。硬體橫向 2400×1080；這台手機當時 Chrome CSS viewport **732×262**、devicePixelRatio **3.278917**，遊戲 capped DPR **1**、drawing buffer **732×262**。保留當時瀏覽器顯示設定及工具列；沒有暗中把 render buffer 拉到硬體解析度。原生錄影可看到此差異。

同一路段 HUD 7590m、trafficSeed=42、約 120km/h、不錄影各跑 12 秒，統一剔除前 2 秒後：

| 指標 | 上一版整體外觀 | R6 |
|---|---:|---:|
| 實際 moving FPS | 22.87 | 18.05 |
| rAF frame P95 | 66.6ms | 82.9ms |
| 暖機人物＋車輪 advance CPU 平均（299 次、不渲染） | 0.036ms | 0.934ms |
| 同上 P95 | 0.10ms | 1.70ms |

**FPS 約下降 21%，P95 約增加 24.5%，未達 <10% 目標。** 單次量測含開發伺服器、CDP、手機熱機與原場景／交通負載，不能宣稱這些差異全部來自頭髮；早先基準約 30 FPS，說明裝置／場景波動大。然而目前證據也不足以宣稱效能安全。GPU timer extension 在這台手機不可用，未虛構 GPU ms。CPU benchmark 包含原人物／車輪工作，差值是 wind＋spring 的近似成本，不是獨立 GPU 成本。

已做一次視覺彈性修正，並針對實機 CPU 將髮型由 120Hz 改為 60Hz；到此停止擴張。**需要 Julia／owner 決定此視覺收益是否值得後續效能工作；本輪不宣稱可發布。** 正常尺寸下的髮尾仍是少量像素，纖細程度、持續飄動是否足夠漂亮，以及車門側姿是否自然，交實機美術驗收。

## 測試、回退與重現

- `npm run verify:dev` 最終通過：113 files / 498 tests；包含 scenic check/test、TypeScript、production build。
- 首輪完整測試找出人物高度、車門手臂間隙與新增 dev query 契約，已修正實際座姿／契約。保留碰撞、幾何、可通行性與舊版 14k 預算檢查；R6 有獨立 15.5k 整車／2.5k 髮型上限，反映本次明確授權的幾何增加。
- 真 GLB 載入、失敗回退、固定頭頂、有限骨骼、停車回穩、暫停、reset、材質／骨架獨立清理皆有測試；桌面實際暫停、重新開始、退出重入通過，沒有 page errors。實體手機的油門與轉彎由測試腳本控制，未把它宣稱為使用者手動操作驗收。
- 新版：`http://192.168.1.106:5194/?at=13910&trafficSeed=42&r5qa=1`，按 START 後在終點前直線加速觀看；左右彎可分別改 `at=3305`、`at=4000`。一般完整遊玩移除 `at`。
- 舊版完整外觀回退：相同 URL 加 **`&r6=previous`**（僅 dev 生效；0.84 人物＋原 Morph 髮型）。舊 GLB 未修改，載入新 GLB 失敗也會自動回到 Morph，再到程序髮型。
- Git 回退基準 `fb52490` 保留；沒有改動 main／發布標籤，也沒有觸發 Actions。
