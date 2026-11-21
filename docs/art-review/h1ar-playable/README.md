# Issue #42 — playable Blender blonde hair

2026-11-14 · dev **0.10.19** · 技術驗證完成，交 Julia／owner 做美術驗收。

本輪僅替換 Riviera 62 女乘客的髮型。來源為已接受的 Blender motion study，沒有重新生成角色；臉、身體、座位、車輛、賽道、物理、AI、Ultra Water 均未修改。額外費用 **NT$0**。

提交前已快轉至 `2a24f9b`，閱讀新加入的 [Spring Bone 技術評估](../../COAST_HEROINE_HAIR_TECH_REVIEW.md) 與 Issue #42 評論。依其「don't interrupt in-flight work／finish a bounded baseline first」，本交付保留已實作、已錄影的 morph baseline。**Spring Bone vs morph 的隔離 A/B 尚未進行**；本輪舊／新影片是舊參數化髮型 vs 新 Blender morph 髮型，不是兩種物理方案的比較。未新增 solver 或依賴，待這一版視覺驗收後再決定是否做小型對照。

## 實際遊戲證據

- [正常追車影片](01-game-chase.mp4)：靜止 → 120 → 294 km/h → A5 左彎 → A6 右彎 → 煞停 → 回落。
- [側後方近距離影片](02-game-close.mp4)：輔助檢查髮根、側後方輪廓與髮尾延遲。
- [原參數化髮型對照](03-original-chase.mp4)：同一遊戲、相同攝影機／速度／種子與路段；僅攔截 GLB 請求以走正式 fallback。
- [正常追車截圖](04-chase-120.jpg)、[高速截圖](05-chase-294.jpg)、[轉彎近照](06-close-turn.jpg)。

影片來自 Chrome 的**實際 WebGL 遊戲畫面**，不是 Blender 動畫或合成髮束。錄影程式只加入 QA 標籤與真實速度／里程；遊戲 HUD 不在 canvas 錄影內，另附含 HUD 的實際截圖。主影片保持正常追車鏡頭，近照影片才移動 QA 相機。1600×900、DPR 1、trafficSeed=42、原遊戲夕陽／畫質。各段間有 QA 跳點，段內使用真實遊戲迴圈、油門／煞車／方向輸入；沒有直接設定髮束權重或改動賽車物理。

錄影腳本：[capture.mjs](capture.mjs)。在 repo 根目錄執行 `node docs/art-review/h1ar-playable/capture.mjs new chase`（或 `new close`／`old chase`），需先有 5194 dev server；輸出到忽略的 `test-results/h1ar-playable/`。此腳本是人工驗收工具，不是 CI gate。

## 自行遊玩／精確重現

本機 `npm run dev -- --host 0.0.0.0 --port 5194 --strictPort`。

- [完整賽道](http://192.168.1.106:5194/?trafficSeed=42&r5qa=1)
- [A5／A6 教學甩尾區](http://192.168.1.106:5194/?at=3210&trafficSeed=42&r5qa=1)：加速後觀察兩次相反方向的髮尾偏移。
- [漁村巡航區](http://192.168.1.106:5194/?at=5230&trafficSeed=42&r5qa=1)：以約 120 km/h 看持續微飄，放開油門／煞車看回落。
- [終點直線](http://192.168.1.106:5194/?at=13910&trafficSeed=42&r5qa=1)：靜止與直線後掠。

URL 的 `at` 是絕對 HUD station；賽程距離顯示另扣起點 350m。URL 開始時速度為 0。要精確重現影片的 294 km/h 入彎，在 DEV 開賽後執行既有 QA：

```js
__drive.reset({distance: 3305, speed: 294 / 3.6, lateral: 0});
// A6 右彎用 distance: 4000；直線用 13910。
// 以下沒有修改髮束輸入，正常操控即可。
```

錄影從 `at=350` 開始後跳至驗收路段，避免對手在同一跳點起跑而干擾定速；路上民車仍使用 seed=42。

## 技術方案／資產

- `scripts/blender/export_playable_blonde.py` 在 Blender 4.5.13 讀取原研究檔的髮型，減面後以最近三角形重心座標轉移五組既有變形場，清除少量孤立碎面，保留大型側分輪廓。原始素模、上色模型與動態研究檔均不覆寫。
- `public/assets/characters/coast-blonde-bob.glb`：**979 triangles、709 匯出 vertices、90,340 bytes（88.2 KiB）、1 opaque material、0 image textures、5 morph targets**。無骨架、透明髮片、動態光源或新物理系統。
- `wind / sway / tipSway / flutterCos / flutterSin` 共用原 `occupants.ts` 的風力、側向慣性、阻尼與相位。原六組非同步髮束權重已烘在五個 morph fields。頭頂和額髮固定；只放大可動髮尾，120 km/h 已有可讀幅度。速度輸入以平方根做幅度映射，不另建時間狀態。
- `src/blonde-groom-asset.ts` 在現有 loading 流程預載一次；`createCar()` 仍同步。下載失敗／超過 6 秒回退舊髮型，下次進入可重試。每輛車有獨立 geometry/material，由現有 scene disposal 釋放；CPU template 不加入場景。
- `src/car.ts` 僅更換女乘客 groom factory，`src/main.ts` 僅加 preload。`package.json`／lock 更新 patch；新單元測試在 `tests/blonde-groom-asset.unit.ts`。

可重建 GLB：

```powershell
& 'C:/astra-dev/tools/blender-4.5.13-windows-x64/blender.exe' -b 'C:/astra-dev/tools/outrun-h1ar3d/heroine-hair-motion-study.blend' -P scripts/blender/export_playable_blonde.py -- public/assets/characters/coast-blonde-bob.glb
```

來源研究檔 SHA-256：`DBDBCB743E354143BFBFCE9DF0B74D28E1D48BA809D7300DE4B6D00AC6C6B0CA`。
交付 GLB SHA-256：`1B54B9823E299519295923D4CA7FE7AE0968ACAF7D101F826E0DD250FFDD1070`。
高模、依賴、權重仍在專案外；本輪 dev 研究樣品不等於 main 發布／授權審查。

## 驗證與效能

- `npm run verify:dev` **PASS**：scenic check／scenic tests／TypeScript／production build，以及 **111 files、494 unit tests**。保留既有碰撞、安全、幾何與 14k 整車預算；新增測試涵蓋真實 GLB、完整實例面數、固定髮根、速度／方向、重設、下載失敗／逾時、共用預載與獨立釋放。
- 實際遊戲整車從 **14,976 → 13,871 triangles**（包含實例與瀏覽器牌照）；髮型 **2,084 → 979**。整車 mesh draws **61 → 59**；整體 scene calls 依可見場景浮動。舊測試未把部分實例重複面數算入，本輪另加完整計數，沒有放寬 14k 上限。
- 新 morph positions＋normals 的 GPU array texture 約 **110.8 KiB**（709 × 2 × 4 × 4 × 5 bytes），另有小型頂點／索引緩衝；沒有每幀上傳頂點，僅更新 5 個權重。替換原有 morph，因此實測 scene texture 數未增加。
- 正常追車的最大髮束變形投影約 **120 km/h 3.2 px、高速約 6 px、左右彎 9–11 px**。量測比較同一幀變形前後頂點，排除整個頭／車輛轉向；不是「每幀抖動」的幅度。
- 兩次返回主選單／重開：每次髮型 geometry/material 各釋放一次、新 geometry id、5 權重歸零；相同起點 **281 geometries／57 textures**，全程僅一次髮型下載。正常載入、錄影與回退對照均無 page error。
- PC 對照詳細數字見 [performance.json](performance.json)，追車摘要與重開紀錄見 [motion.json](motion.json)、[lifecycle.json](lifecycle.json)。完整逐幀資料保留在本地 `test-results/h1ar-playable/`；錄影腳本可重建。效能量測不錄影，使用遊戲既有 GPU timer（含 FFT／boat shadow／main scene）。

RTX 5070 Ti、Chrome 157、1600×900、7590m 起跑後 120 km/h 巡航；排除前兩秒，取後八秒。單次短測、GPU 各 16 個有效樣本，不能把微小差異解讀成確定的效能提升或退步：

| 指標 | 舊髮型 | 新 Blender 髮型 |
| --- | ---: | ---: |
| 平均 FPS | 60.00 | 60.00 |
| 各秒最差 P95 frame gap | 16.8 ms | 16.8 ms |
| CPU callback 平均 | 3.02 ms | 3.21 ms |
| GPU 平均／P95 | 3.93 / 5.98 ms | 3.98 / 6.43 ms |
| 最後一秒 geometry／texture | 359 / 61 | 357 / 61 |

**待 owner／Julia 驗收**：正常追車下擺幅是否自然、短金髮輪廓與原型身份是否滿意。這是單一樣品，沒有展開變體或下一階段。

**限制**：沒有連接 Pixel 8，尚未做手機熱機／長時間實測；RTX 5070 Ti 的短時間結果不能代替手機驗收。小髮尾在低解析度和低對比夕陽背景仍可能變弱；既有低解析度陰影在近距離會出現細碎硬邊，沒有為本輪改動全域陰影／畫質。正面臉部仍為既有遊戲角色，本輪不做臉部美術驗收。
