# R7H — 女主角全身與遊戲動作，v0.10.28

2026-11-15，Issue #50 的可遊玩 **dev 美術驗收候選**。本輪到此停止，等待 Julia／使用者驗收；沒有發布 main。額外費用 NT$0。

## 來源與交付

- [正式服裝／姿勢圖](approved-fullbody-and-poses.png) 已依 ZIP 的 [SHA-256 manifest](reference-manifest.json) 核對三個內容檔；主 PNG 為 `06bee74821689b671f13e56892cac3a328b9bd3a8c873ca27c6c4164bcd34cf4`。臉部身份沿用 [已核准 H1aR 設計](../r7a/approved-reference.png)。圖上的左右文字不作座標依據。
- 從 `C:/astra-dev/outrun/art-prototype/output/r7a-heroine-upper-body.blend` 繼續製作。沿用減面後的原始臉／頸／眼睛／耳環，未重新推論、未以數學幾何造臉。原上色高模與 R7A 檔案未覆寫。[來源校驗](source-audit.json)。
- **可編輯全身母檔**：`C:/astra-dev/outrun/art-prototype/output/r7h-heroine-fullbody.blend`。
- **可直接看站姿的棚拍檔**：`C:/astra-dev/outrun/art-prototype/output/r7h-heroine-review.blend`。包含四視圖相機、燈光、同一角色。Blender 檔依既有政策保留本地，不提交 Git。
- 全身 GLB：`public/assets/characters/coast-heroine-r7h-full.glb`，包含腿、鞋及未修改的 R6d 髮型副本；普通比賽不載入。Bind pose 供編輯／動畫使用，站姿驗收使用上述 review.blend。
- 賽車 GLB：`public/assets/characters/coast-heroine-r7h-race.glb`，由同一母檔移除腿與鞋，保留可見上身及裙／膝上衣料。遊戲沿用原本獨立載入的 R6d 頭髮，不重複載入髮型。

## 圖片與影片

[全身四視圖總覽](fullbody-four-views.jpg)：[正面](studio-front.jpg)、[45°](studio-front45.jpg)、[側面](studio-side.jpg)、[背面](studio-back.jpg)、[露背近拍](studio-back-detail.jpg)。均為本機 Blender Cycles 真實 3D 渲染。

| 遊戲視角 | R7H | R7A → R7H，同鏡頭比較（左舊、右新） |
| --- | --- | --- |
| 正面／45° | [正面](game-front.jpg) · [front45](game-front45.jpg) | [比較](compare-front45.jpg) |
| 背面／45° | [背面](game-back.jpg) · [rear45](game-rear45.jpg) | [比較](compare-rear45.jpg) |
| 側面／座艙 | [側面](game-side.jpg) · [座艙](game-cockpit.jpg) | 同 HUD 3210m |
| 正常追車 | [追車](game-chase.jpg) | [比較](compare-chase.jpg) |

五個 **1600×900 原追車鏡頭**：[坐姿右吆喝](game-shoutRight.jpg)、[坐姿右飛吻](game-kissRight.jpg)、[起身左吆喝](game-shoutLeft.jpg)、[起身左飛吻](game-kissLeft.jpg)、[雙手過頭歡呼](game-victory.jpg)。黃色框標出真實對手車，左方為駕駛側／local +X，右方為乘客側／local -X。沒有鏡像翻轉。

[14 秒實際遊戲影片：右吆喝 → 右飛吻 → 左吆喝 → 左飛吻 → 歡呼](five-actions-wild.mp4)。原 8m 追車鏡頭、seed 42、wild、約 224 km/h、1600×900／DPR 1。此影片使用 **DEV 動作播放與對手定位 fixture** 讓五姿勢可重現；道路、車輛、動畫與 Spring Bones 都由遊戲即時運算，沒有合成角色或 AI 影片。字幕與目標框僅加在錄影 Canvas，不加入正式 UI。它證明畫面與動作，事件觸發另由下列測試證明。靜態近拍使用驗收腳本相機，未修改遊戲追車鏡頭。

## 這輪做了什麼

- 新增連續頸肩、上背與手臂表面並接入同一骨架，移除 R7A 外接手臂／下裙。修整皮膚色彩、眼白溢色，增加小幅嘴唇、口腔／牙齒與握杯狀手勢控制；保持原臉型、鼻子、下巴。
- 建立象牙白掛頸交叉前領、側腰結、非對稱重疊裙片、腿與細跟涼鞋、金色手環。背部上緣在腰部，沒有兩條背帶。動作中仍由同一網格銜接肩膀與手臂。
- Blender 烘焙五個指定動作及既有 wave／applause 相容動作。14 骨、4 個 morph（smile／mouthOpen／pucker／handCup），用 Three.js AnimationMixer 播放。頭髮既有 pivot 跟隨真正頭骨姿態，頭轉與車身傾斜繼續存在。
- 小型獨立超車機會觀察器：並排、玩家正在追越、可辨識左右、單一對手鎖定、4 秒冷卻、明確交替 shout／kiss。原 +5.5m 超車計分規則未動。碰撞／場景重設取消動作；暫停不前進；終點歡呼 2.2 秒後顯示原結算，不改名次與競賽時間。
- R6d GLB SHA-256 保持 `8273fe14b4f1c83a4c8b574bacd7d834a6142380013e6e8ebb6f7b447399f519`；Spring Bones、wild 參數、男女 1.0 scale、男主角、車體、賽道、AI、Ultra Water 均未修改。

## 成本與驗證

| 資產 | triangles | 材質繪製批次 | GLB bytes | 骨骼 |
| --- | ---: | ---: | ---: | --- |
| R7A 上半身基準（另有程式手臂／裙） | 30,502 | 4 | 1,361,900 | 2 |
| R7H 賽車版（含完整活動手臂） | 28,647 | 4 | 1,558,724 | 14 |
| R7H 全身展示版（含 R6d 髮型） | 40,238 | 5 | 2,049,392 | 身體 14＋既有髮型 25 |

R6d 髮型仍為 3,559 triangles、25 個 skin joints（其中 18 個 spring joints）。賽車 GLB 約增加 192 KiB，主要為動畫／morph 資料。沒有新材質 shader、透明頭髮或動態光源。

同 HUD 3210m／原追車視角的 `renderer.info.render`：**472 → 469 calls，782,785 → 779,812 triangles**。這是相同場景的整張 render 計數，已包含取消舊手臂／下裙的差異，不等於 GPU 毫秒。

本機 RTX 5070 Ti／Chrome 的角色更新微基準（含原頭髮、車輪與 world matrices，30 組 × 120 步，非完整幀）：每步中位數 **0.0675 → 0.0892 ms**，批次平均的 P95 **0.0700 → 0.0917 ms**。多出的骨架／Mixer 約 +0.022 ms；這不是手機 FPS，也不是 GPU timer。完整資料在 [metrics.json](metrics.json)。

**Pixel 8 未連線**（ADB devices 空清單）；未測本輪手機 FPS／P95，也沒有 GPU 毫秒／VRAM 實測。R6 先前手機曾記錄 22.87 → 18.05 FPS 回退，R6d／wild 的成本問題仍未獲性能放行。本次較低面數不能當作手機效能已過關。

- `npm run verify:dev`：**通過**。scenic:check、scenic:test、TypeScript＋Vite build、**120 檔／517 tests 全數通過**。本輪完整命令執行一次。
- 保留碰撞、道路幾何、可通行性與效能安全測試。新增並排觸發／左右鎖定／冷卻、重設／碰撞拒絕、骨架與向量方向、雙手過頭、露背 raycast、賽車版無腿、權重正規化、暫停／stall、資產回退與 disposal 檢查。
- Playwright 真實競賽步進：[事件證據](events.json)，左右各完成一次吆喝與一次飛吻；同場景真實終點事件先歡呼再顯示結果。沒有改寫觀察器輸出來通過測試。
- 真實 UI：[暫停／恢復／重新開始／回主選單再進場](lifecycle.json) 通過；重新開始回到 350m，沒有卡在起身或繼承上一場動作。Chrome page errors 0。

## 重現及回退

- 遊玩：`http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild`。
- 近拍區：`http://127.0.0.1:5194/?at=3210&trafficSeed=42&hairWind=wild`。
- 開發版回退加 `&heroine=r7a`；更早程式人物用 `&heroine=previous`。新 GLB 失敗時會先試 R7A。正式 production 查詢不啟用這些 dev 選項。
- `node docs/art-review/r7h/capture.mjs before --static`／`after --static`；`node docs/art-review/r7h/capture-actions.mjs`；`node docs/art-review/r7h/lifecycle.mjs`；`node docs/art-review/r7h/audit.mjs`。
- 匯出：Blender 4.5 `-b -t 4 -P scripts/blender/build_r7h.py`；棚拍：`-P scripts/blender/render_r7h.py`。使用現有安裝，不新增依賴／付費工具。

## 待 Julia／使用者驗收

本版已有可玩的完整動作與連續露背肩臂，但不宣稱已達最終美術品質：**近拍眉眼／耳側仍能看到原模型塗色碎邊，肘部彎曲及前領結的輪廓仍偏硬，布料皺褶與飛吻口型仍較簡化**。原追車距離能辨識坐姿右轉、起身左轉和雙手過頭；臉部表情需以近拍檢查，不能因追車看不到五官便判定通過。裙、鞋、肩背比例及五姿勢魅力請以上述原始畫面決定是否接受。這輪不再自行延伸男主角、車體或髮型調整。
