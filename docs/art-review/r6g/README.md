# R6g — Controlled Layered Bob Prototype

2026-11-14，dev **0.10.25**。使用者授權的一輪可玩原型，NT$0。**工程驗證通過，尚未通過美術驗收；到此停止造型延伸。**

## 最高優先的髮型參考

本輪中途使用者指定這張 [女主角多視圖](owner-reference.png) 比 Style B 總覽更重要，已更新 repo 參考優先順序。以側分 sweeping 瀏海、飽滿短 bob、後腦相互交疊的大髮束、小量下緣外翻及暖金色階為目標；圖片內文字不作施工規則。沒有更動臉部、身體或服裝。

原附件保留原始 bytes，SHA-256：`481c9518d889bd3fa006c9935567e3f3b8720002beaff9f58ab516e7bc946c4a`。

## 實際遊戲驗收

靜態三欄從左至右 **R6d → R6f → R6g**：

- [背後45°](rear45-comparison.jpg)
- [正面45°](front45-comparison.jpg)
- [側面](side-comparison.jpg)
- [正常8m追車](chase-comparison.jpg)
- 補充：[正背面](back-comparison.jpg)

動態兩欄為 R6d → R6g：[80 km/h](80-comparison.jpg)、[120 km/h](120-comparison.jpg)、[300 km/h](300-comparison.jpg)、[左彎](left-comparison.jpg)、[右彎](right-comparison.jpg)。R6d保留了之前R6b中下段及髮尾方案，可用來檢查本次是否失去原先的飄動優點；本輪未額外聲稱做過R6b獨立實機驗收。

[17.4秒 wild 實際遊戲影片](wild-gameplay.mp4)，1600×900，包含靜止、80／120直線、300高速、約280左右彎、煞車至靜止。這是遊戲WebGL實際錄影，非Blender動畫或生成影片。

PC Chrome／RTX 5070 Ti，DPR 1，原追車鏡頭、1.0男女主角，`trafficSeed=42`。人物／車輛／場景照明相同。45°及側面僅在驗收頁暫時移動相機，兩側同裁切；正常追車保留完整畫面。錄影頁暫停隨機超車歡呼觸發以利比較，正式遊戲歡呼與動作系統未變。片段間用開發工具定位，非從起點一路駕駛；瀏覽器時序未逐幀鎖定。

## 簡短評估與停損

1. **是否比R6d更接近設計圖？** 主束方向與圓潤bob輪廓有所接近，但尚不能認定整體美感優於R6d。主束仍偏規則、偏寬，束根和交疊邊緣有硬接縫／局部穿插；缺少設計圖較自然的S形轉折與柔順末端。工程上是獨立立體束，視覺上部分上段仍讀成拼接的大塊外殼。
2. **是否比R6f更可控、更優雅？** 可控性明顯改善：內層不再是大片深色頭套、輪廓縮回短髮、主束不會與每條小髮尾同級搶戲。這不等於已達設計圖的優雅程度，尤其近看接合處仍需美術判斷。
3. **正常追車能否看出分層、分束、受風吹動？** 可以看見穩定主體及下緣較活潑的動態，但8m視角下主束分組可讀性仍有限，不像近看那麼清楚。沒有證據支持「已明顯全面超越R6d及之前已驗收的中下段髮尾」。

因此本輪作為結構／動態有正面證據、美感仍有負面證據的候選交回，不再自行開下一輪調參或模型變體。由使用者與Julia驗收。不要把測試綠燈當成美術PASS。

## 三層結構與動態

- **內層**：562頂點／1,120 triangles的閉合暖蜂蜜金髮量，固定於頭部並隨既有頭部動作。退在主束之內，額前與太陽穴邊界避開臉頰；不是表面刻紋的主髮帽。
- **8主束**：沿頭型的明確角度曲線塑造，根部埋合、中段有凸形厚度、末端收尖。包含長側掃前束、左右耳上包覆、後腦左右束及後頸交疊束。單束最大寬78–108mm、完整截面厚度最高26mm。
- **10輔助束**：集中耳後與下緣，寬25–32mm、曲線弧長約141–183mm，完整截面厚度最高10mm；比R6f的長外拋束短。不是所有髮束都同級或同等自由。
- **材質**：單一opaque MeshStandardMaterial、roughness .62，四組金色色階沿束身分布；根與底側較暗、凸面及少量脊線較亮。無alpha卡、新貼圖、新燈光或shader框架。
- **Rig**：18條獨立鏈，每鏈3個活動joint及1個末端骨，加固定根共73骨／54活動joint。主束固定權重在前34%漸退，輔助束前19%漸退；中段／末端真正蒙皮，不是貼在殼上一起搖。
- **Spring**：沿用現有求解器、頭／頸球碰撞體、60Hz有限步進與reset／pause／長幀恢復。主束stiffness 8／5／2.8，drag .48／.36／.28；輔助束5.2／2.8／1.5，drag .37／.27／.20。每束既有phase／lag差異保留。
- **Wind**：`src/cabin-wind.ts`完全未修改。主束吃wild力的 .18／.45／.72，輔助束 .46／.86／1.05；這是使用者授權的分層響應，不是為FPS暗中停用動態。既有R6d／R6f參數分支不變。

實際300 km/h片段，各層「逐關節峰值後取各束平均」的角度：主束根／中／尾約 **1.1°／13.7°／36.7°**，輔助束約 **4.3°／37.3°／43.5°**。顯示中段仍活動且邊緣更活潑；角度不是美感分數。完整各狀態見 [capture-summary.json](capture-summary.json)。

沒有加入髮束自碰撞或完整肩部碰撞；球體只是粗略防穿頭約束，不能宣稱所有姿勢完全不穿插。

## 成本

|項目|R6d|R6f|R6g|
|---|---:|---:|---:|
|Triangles|3,559|8,000|10,120|
|Render vertices|2,242|4,034|5,098|
|GLB bytes|153,240|300,940|370,812|
|骨骼／活動joint|25／18|81／64|73／54|
|髮型主畫面draw calls|1|1|1|
|同位置場景draw calls|120|120|120|
|同位置場景triangles|581,695|586,136|588,256|

比R6d增加6,561 triangles及36個活動joint；比R6f增加2,120 triangles但少10個活動joint。GPU幾何與蒙皮成本增加，CPU求解較R6f少但高於R6d；沒有量測到足以宣告FPS改善的數據。沒有新增runtime依賴或逐幀CPU改寫頂點。

內層本身占幾何11.1%。髮型自身深度投影估計，固定部分（內層加固定束根）占追車可見髮型約22%、背後45°約16%，較R6f的大片內層暴露收斂。這個估計不含臉／身體遮擋及照明，不能解讀成整張遊戲畫面的占比。詳見 [render-costs.json](render-costs.json)。

**本輪未實測Pixel 8 FPS**，先前R6手機退步仍未解決，不宣告公開發布就緒。

## 驗證、試玩與保留版本

最終模型的 `npm run verify:dev` 通過：production build成功，**117個測試檔／510項測試全部通過**。Vite既有大bundle提示仍在。新增測試驗證19個閉合網格島、18條有效歸一骨鏈、每束根／中／尾響應、輔助束較活潑、主束峰值有界、根位置固定、pause/reset/replay/長幀恢復。沒有刪除舊碰撞、幾何或效能安全檢查。最終遊戲捕捉確認73骨／10,120 triangles、非fallback，page errors為空。

- [R6g wild](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild)
- [R6d wild](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild&hairStyle=r6d)
- [R6f wild](http://192.168.1.106:5194/?trafficSeed=42&hairWind=wild&hairStyle=r6f)
- 可加 `at=14000` 看直線；左彎 `at=3305`、右彎 `at=4000`。進入遊戲即可自行駕駛。

R6g僅dev預設，production仍R6d；原GLB均保留，`hairStyle=r6c`／`hairUpper=old`／`hairMid=old`／載入fallback也保留。不動main、沒有release tag或手動CI。

## 修改檔案與重現

- `scripts/blender/export_r6g_hair.py`：本地Blender離線造型／rig／Vertex Colors來源，手工配置8+10條曲線。`public/assets/characters/coast-blonde-r6g.glb`為輸出。
- 本機可編輯來源：`C:/astra-dev/outrun/art-prototype/output/r6g-layered-bob.blend`（本地忽略目錄），原高模與上色版本未動。
- `src/blonde-groom-asset.ts`：dev選擇與73骨載入驗證；`src/blonde-spring.ts`：分層參數；`src/runtime-query.ts`：R6f回退開關。
- `tests/blonde-r6g.unit.ts`／`tests/runtime-query.unit.ts`：必要回歸；package及lockfile版本同步0.10.25。
- 美術文件記錄新參考優先序；[asset-audit.json](asset-audit.json)列出每束尺寸與數量。

GLB SHA-256：`b47904ef20a1b08774889f7660a3dbc74949483dfa8da9fe2a592f8ac1aa33fd`。

模型重建：`blender -b -P scripts/blender/export_r6g_hair.py -- public/assets/characters/coast-blonde-r6g.glb`。先完成build／版本更新後啟動5194，依序執行 `node docs/art-review/r6g/capture.mjs before`、`extreme stills`、`after`，再執行 `node docs/art-review/r6g/package-evidence.mjs`。沿用現有Blender、Chrome、Playwright、ffmpeg、ImageMagick；無額外費用。
