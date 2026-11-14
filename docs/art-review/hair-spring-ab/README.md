# Issue #43 — one fine-tip Spring Bone A/B

2026-11-14 · base `bb2ee42` · **隔離實驗完成，尚未採用 B；交 Julia／owner 驗收。**

**結論：技術上可行，但正常追車尺寸的美術優勢有限。** B 的下緣髮尾較分散、轉向與減速有連續回彈，沒有靠加大整個髮團位移展示效果。近照較容易辨認；8m／960×540 每側畫面中，頭髮僅約二十多個像素，細緻程度的差異仍小。現有低面數底緣依然偏塊狀，Spring Bones 本身不會變出細絲。**不能據本片宣稱已達「漂亮纖細髮尾」的最終標準，也不建議直接替換正式遊戲。** 不再增加樣品或調參輪次。

## 驗收媒體

- [01 正常 8m 追車 A/B，13.3 秒](01-chase-ab.mp4)：左 A／右 B，每側原生 960×540，無局部放大。
- [02 輔助側後方近照 A/B，13.3 秒](02-detail-ab.mp4)。
- [03 兩欄四列比較 JPG](03-comparison-2x4.jpg)：120、300、左彎、右彎。
- [04 原始／局部收細後輪廓](04-tip-silhouette.jpg)：靜止，與物理比較分開。
- [量測與資產紀錄](measurements.json)。

這是 **isolated Three.js viewer 的實際網格變形**，不是實際賽道、Blender 預烘動畫或影像合成髮束。借用現有 Riviera、座姿、頭部 pivot 和 `chaseTargets()`；灰背景／固定暖光兩側完全相同，沒有加入 Ultra Water、場景、陰影或行車物理。影片時間表：

| 秒 | 相同輸入給 A／B |
| --- | --- |
| 0–1.2 | 靜止 |
| 1.2–3.2 | 120 km/h |
| 3.2–5.4 | 300 km/h |
| 5.4–7.1 | 300 km/h，側向加速度 +10 m/s² |
| 7.1–8.8 | 300 km/h，側向加速度 −10 m/s² |
| 8.8–10.4 | 300 km/h，快速左右轉頭 ±27.5° |
| 10.4–11.4 | 300 → 0 km/h |
| 11.4–13.3 | 回穩 |

## 一個樣品，公平比較

已檢查接受的 Blender 原型：**7,934 vertices、12,000 triangles、Basis＋5 Shape Keys、6 組動態髮束及固定髮頂組**。原始研究檔 SHA-256 仍為 `DBDBCB743E354143BFBFCE9DF0B74D28E1D48BA809D7300DE4B6D00AC6C6B0CA`。

沿用 Issue #42 的 979 面版本。只對六個側邊／後頸角向區域的下緣收窄，依深度漸進縮窄 42%，末端向下延伸最多 9mm；最大單點形狀變更 17.9mm，頭頂、額髮不變。不新增大量髮片、不重建角色。這是原髮型的局部造型調整，**不是另一個髮型或整頭代理模型**。

**A、B 的基礎頂點位置逐值相等，索引、頂點色、材質與相機共用同一來源。** 兩側都採用這個局部收細的底緣；A 保留原五個 morph 的已調整風力映射，B 關閉 morph，以 GPU skinning 驅動局部髮尾。原樣 vs 收細樣另見圖 04，不能把這項形狀差異算成 B 的功勞。

| 項目 | A | B |
| --- | ---: | ---: |
| 髮型 triangles／vertices | 979 / 709 | 979 / 709 |
| 不透明材質／貼圖 | 1 / 0 | 1 / 0 |
| 動態控制 | 5 morph weights | 6 條短鏈，各 2 活動關節 |
| 骨架 | 無 | 19 bones＝固定根＋12 活動＋6 末端 |
| 髮型 draw calls | 1 | 1 |
| 同一視角整個預覽 scene draws／triangles | 48 / 12,577 | 48 / 12,577 |

雙用途研究 GLB（同時含 skin 與 morph）**95,060 bytes**。此檔可由 Blender 編輯，已在 GLTFLoader 中驗證 skin、morph、材質正常。它是 A/B 研究容器，不是分別最佳化的 A-only／B-only 生產檔，因此不拿其大小宣稱哪種方案較省。

## 控制器與檢查

- 採用 **`@pixiv/three-vrm-springbone` 3.5.5，MIT，僅獨立套件**。`VRMSpringBoneManager`／`Joint` 可直接控制 glTF bones，沒有載入完整 VRM。選擇它是因為短鏈、drag、length constraint、sphere contact、reset 均已具備，無需自製通用 solver。[官方 Joint API](https://pixiv.github.io/three-vrm/docs/classes/three-vrm-springbone.VRMSpringBoneJoint.html)
- 真正沿用 `createOccupantMotion()` 產出的 `wind / sway / tipSway / flutterPhase` 作虛擬測試信號。B 每鏈略不同 stiffness、共用相位但有偏移；風力飽和、方向經頭部座標轉換，髮尾順序跟隨。沒有逐頂點 CPU 更新、隨機噪聲或網格重建。
- 固定 **1/120s** 更新；外部 dt 上限 **50ms**，accumulator；使用車體相對 center，避免把 300 km/h 世界平移再次當風力。骨長由套件約束；本輸入最大局部關節轉角 **20.39°**。沒有新增布料或完整人物物理。
- 一個頭頸 sphere collider、3mm joint hit radius。這是廉價頸部保護，**不是完整耳朵／肩膀／座位碰撞驗證**。影片抽查沒有明顯穿肩、脫根或爆面；正式採用前仍需其他姿態和遊戲測試。
- 同一 13.3 秒腳本：有限座標 PASS、A/B rest geometry 一致 PASS、B 髮頂位移 <2e−15m、reset 回到原形誤差 0；輸入 dt=1s 時只前進 6 個固定步。明確 reset hook 驗證成功；本輪沒有正式遊戲 pause／teleport 事件整合。
- A／B 最大局部位移約 **9.38cm／6.58cm**（尚未乘乘客 0.84 scale）；B 沒有藉更大總位移取得視覺差異。

## 小規模成本紀錄

RTX 5070 Ti／Chrome 157、1920×540 雙面板，同次錄影，A/B 繪製先後交替。GPU timer 每側 470 samples，計整個隔離預覽 scene；CPU 僅各控制器 update，排除兩側共同的 fixture／車輛操作。瀏覽器計時解析度及錄影有干擾，**不是手機 benchmark**：

| 指標 | A | B |
| --- | ---: | ---: |
| CPU 平均／每 120Hz step | 0.0013ms | 0.1443ms |
| CPU P95／step | <計時解析度 | 0.3000ms |
| GPU 平均／每側 render | 0.1505ms | 0.1565ms |
| GPU P95 | 0.3835ms | 0.4086ms |

B 在 60Hz 畫面每幀通常做兩步，約增加 **0.29ms CPU** 的量級；本次沒有可辨識的 GPU 優勢。A morph position/normal array texture 約 110.8KiB；B 額外 skin index/weight 屬性約 17KiB，19 bones 的矩陣 texture 約 2.25KiB（Three.js 對齊為 12×12 RGBA32F；allocator 額外負擔另計）。沒有 Pixel 8 實測，不能判定行動裝置效能或熱穩定性。

## 本地檔案／重現

- 接受的原檔（未改）：`C:/astra-dev/tools/outrun-h1ar3d/heroine-hair-motion-study.blend`。
- 實驗副本：`C:/astra-dev/tools/outrun-hair-spring-ab/heroine-tip-spring-ab.blend`（13.8MB；保留隱藏原始研究物件，可自行取消隱藏）。
- 可載入 GLB：`C:/astra-dev/tools/outrun-hair-spring-ab/same-mesh-ab.glb`。
- GLB SHA-256：`0554C5995EA8725448B7D7F8167BF80B78D9C8E8541CB61E56F7D6116D9F4DF5`。
- 套件／LICENSE：`C:/astra-dev/tools/outrun-hair-spring-ab/package/`；無安裝到 OutRun dependencies。
- 生產、viewer、錄影、audit 腳本與原始紀錄備份：`C:/astra-dev/tools/outrun-hair-spring-ab/reproduce/`。
- 工作副本：`C:/astra-dev/outrun/test-results/hair-spring-ab/`。本次隔離 server 為 `http://127.0.0.1:5195`；不占用遊戲 5194。viewer 是靜態 QA 控制頁，動畫由 capture 腳本或 `window.ab.advance(dt); window.ab.render()` 驅動。

由 repo 根目錄執行 `node test-results/hair-spring-ab/capture.mjs chase`／`close`；`audit.mjs` 做小型結構檢查。備份目錄內容可放回上述工作副本位置後重建。Blender 使用 `author.py` 讀取既有研究檔另存，禁止拿實驗檔覆蓋 master。

**正式遊戲零變更**：`src/`、`public/`、package／lock、版本號皆未修改。只提交本報告、小型影片及 JPG。依 Issue #43 不執行完整 `npm run verify:dev`；實驗已完成 GLB 匯入、實際渲染、有限值／固定根／dt／reset 檢查，兩種視角均無 page error。未動 main、未開 CI、未使用付費服務（NT$0）。正式採用與是否保留收細輪廓，由 Julia 與 owner 決定。
