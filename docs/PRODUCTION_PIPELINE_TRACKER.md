# 極速漫遊｜製作流程重整與 Action Tracker

### 2026-11-18 — P2-G1 原創美術圖公開納入 Git（不改現有 Macro 驗收狀態）

Michael 已授權將原創設計圖放進公開 repo，實際 PNG / SHA-256 / 來源目錄為 [`art/reference/coast/kenting-beach/`](../art/reference/coast/kenting-beach/README.md)（00–04 五圖及 05 本人道路揭幕草圖）。更新 Issue #67 以此為優先概念來源，不再將已入庫的概念板當作本機 ZIP 阻擋。*但*目前右彎揭幕、沙灘整體配置、遊玩感受與 3D 建模／手機效能仍以 Issue #67 對應實際版本的驗收決策為準；概念圖不會自動解鎖下一階段。第三方參考照片／私人混元模型仍不在公開授權範圍。


### 2026-11-18 — 女主角最新設計圖核准（DOCUMENTATION ONLY / CHARACTER HOLD）

Michael 核准新 [R7A 風格女主角全身設計圖，頸後蝴蝶結版本](https://chatgpt.com/space/page_856b88a66e808191b39426c84396ddd3)（原始 PNG SHA-256 `abfecddcc8a36ea5c31372df25ff5e505d7ba5dafe5f90e2b144a820687c8dae`）。此設計在**角色美術視覺規格**上優先於 11/15 的 B-2 雙背帶與其他探索稿。維持原短金髮、臉、耳環、象牙白交疊掛頸短裙、側腰結、露背與身形，取消兩條平行肩背帶，在後頸以小蝴蝶結收束。**目前只更新設計基準／文件**：舊 3D 賽車 GLB、Blender 來源、動畫、手機驗收與正式上線狀態全部未變；角色建模仍 HOLD，不取代 11/17 海水浴場與車輛的工作優先級。舊角色設計圖與 B-2 實作證據保存為歷史，不作當前造型施工依據。


### 2026-11-17 — Owner 最新方向：先做墾丁記憶的海水浴場；混元車成為正常預設主角車

**主線美術目標：[P2-G1 #67 南國海水浴場](https://github.com/michael-wang/OutRun/issues/67)**。Michael 明確要求**優先製作海水浴場，而非工作港口**。場景取自其記憶中墾丁沙灘的氛圍：寬闊沙地／海水淺灘過渡、成群彩傘、戲水人群、遠方山與海，配合 Style B 的暖色黃昏；不能僅堆小物。位置**尚未正式定案**，現有正式 `beach-market` 左海側海水浴場 hero anchor 在 HUD **5,980m**、5,300–6,120m 和緩長彎，是第一個可移動測試場。Judy 預先驗證近海地形與 Ultra Water 水位/岸線的實際連續性，先從 200–300km/h 追車鏡頭看出完整的沙灘，再擴充陽傘、救生站、泳客與租借用具。資產採 Asset Library → `packages.json` → `scenic-layout.json`，如需大面積岸線需局部重配海岸遮罩與 terrain 而不重做模型、不改整關公路；詳見 [正式美術 Brief](COAST_KENTING_BEACH_BRIEF.md)。以 `dev` 直接開發，一次完成真正可玩的景點再驗收。

**平行整合目標：[P1-G4 #68 新混元車正式預設](https://github.com/michael-wang/OutRun/issues/68)**。Michael 不希望再輸入 `hero3d=1`；Judy 要讓正常遊戲自動載入已接受的 Option B，保留原車 fallback/QA，不可只修改 URL 判斷。原 GLB 僅本機 `.local` / loopback 服務，不在 production/PWA，所以須建置真實的正常載入／私有 staging／正式離線包流程。**全球公開 `main` 仍有授權關卡**：Hunyuan3D 2.1 Community License 的地域限制包含生成 Output；在釐清 EU/UK/South Korea 發布權利前不擅自讓全球網站散布此模型。優先完成 `dev` 無參數預設和手機／本機 production-like 測試，發行資產需要合法來源/許可與主人發布決策。不要讓法律/打包問題阻止海水浴場施工。

**最新工作授權：**兩個完整 Goal，Judy 監督 Codex，自主施工、測試、修補，最後交真實遊戲照片給 Julia/Michael；不逐小件停止、也不先開新 feature branch。四項 G3 車體精修（前燈、尾牌尺寸、金框排氣、座後空洞）保留 Deferred Polish，不擋下一階段。工作港口改為較後順序；海水浴場已正式取得 owner 施工權限。

### 2026-11-17 — P1-G3 正式驗收 PASS；四項車身美術待辦延後

Michael 於實際遊戲中檢查 Option B 前後／左右／側上方五張畫面，確認**目前設計圖落實到遊戲的程度已滿意**；Julia 同意結案 [P1-G3 Issue #66](https://github.com/michael-wang/OutRun/issues/66)，視為 **indie-game prototype PASS，非最終發行資產**。Judy 回報 `dev f29410d`、v0.10.33、`verify:dev` 122 files／524 tests PASS，實際 Chrome 15／15 PASS；**Pixel 8 真機、實體搖桿及全球商用授權尚未驗證**。右蘑菇頭環視、L3 回追車、R3 截圖映射原樣保留，玩家與女伴及競速維持可玩。

**四項 Deferred Polish，均非目前阻擋：**（1）**中**：前燈造型與設計圖差異，LED 燈殼／線條待日後修；（2）**低**：車尾深色 `Coastal Highway Racing` 牌面比例偏大；（3）**低**：排氣管金屬／金色邊框太暗、不夠醒目；（4）**低**：座椅後方空洞，在一般遊戲追車角度不顯眼。原圖與驗收文字記錄於 [Issue #66 review](https://github.com/michael-wang/OutRun/issues/66#issuecomment-6942153067)。不要為這四項立即重啟車型美術工作。

### 下一項 Julia 建議（尚未授權）：P2 英雄景點 Asset → Package → Layout

第一個建議選用已存在的 `working-harbour`、道路 **4,600m** 錨點，以少數 **可重用** 3D 漁船／港邊房屋／碼頭設備組成一個可信的台灣海岸工作漁港景點包；**位置由 `scenic-layout.json` 管理，資產不含硬寫死的里程數**。採 Style Option B 夕陽海岸風格，驗收重點是 200–300 km/h 第三人稱追車鏡頭的辨識度、海岸層次、行車視線與真機效能，不是背景小道具數量。現有錨點有九個、目前只用一個 rural-hamlet-pilot package。完成這個 P2 見證後，再安排海濱市集／帆船灣等 Hero Scenic，並做第一關整體賽車節奏評估。**此為建議，Michael 尚未授權施工。** 不要在此之前恢復角色／車身微雕或建造第二關。

### 2026-11-17 — G3 最新授權：設計圖兌現＋環視鏡頭（L3 重置，R3 截圖）

**G1＋G2 可玩原型已正式驗收 PASS 並將 [PR #64](https://github.com/michael-wang/OutRun/pull/64) 合併至 dev（`c0e63e8`）；[Issue #65](https://github.com/michael-wang/OutRun/issues/65) 結案。** Michael 試駕約 80 分，仍看到 **輪拱像外加隆起擋板**、**車尾舊 `FZR-123` 車牌／簡化燈條／排氣管與設計圖不同**。這些列入 [**G3 Issue #66**](https://github.com/michael-wang/OutRun/issues/66)，Judy 自主在 **dev 直接開發**，不再開長命 feature branch 或逐件等待批准。

**G3 需一次完成兩類工作：**（1）[私人對照頁](https://chatgpt.com/space/page_abf24af3c7808191b6bce5b8b2842bf4) 含 Michael 提供的三張真實遊戲畫面與 Option B 車尾設計，要求輪拱葉子板真正一體成形、車尾細長燈具和深色品牌面板（不是舊白車牌）、兩個寬而有金屬飾邊的排氣口，需以正常後追／側後角度驗收；（2）**右蘑菇頭水平環視（繞車中心世界 Y）＋放開停留＋L3 按下恢復原追車視角**；**R3 照舊截圖**，別和 L3 搞混。保持舊車、男女主角、輪組／煞車控制／競速與 L1/R1 對手鏡頭正常。車尾細小瑕疵可接受，著重形狀語言與設計一致性。

**Dev-first 原則已生效：**新里程碑預設在 `dev` 直接提交，`main` 仍為公開穩定版；原 G1/G2 遠端 feature branch 可經差異檢查後退役，歷史失敗證據 #61／checkpoint 分支先盤點再整理。私人混元 .blend/.glb 沒有公開上傳，`?hero3d=1` 的模型仍需本機 staging。真正手機 FPS、全球商用權利仍未驗證。新功能目前只是**授權待開始，不是已實作**。

### 2026-11-17 — Git 流程簡化：核心工作採 dev-first（Owner 最新決策）

**Michael 指定：獨立遊戲的核心開發（包含 Riviera 62 建模、上色、可玩整合）以後預設**直接在 `dev` 小步提交，**不再每個里程碑開新 feature branch / PR**。Git commit 可保留基本回退能力；`main` 仍只用於已驗收公開版本；`dev` 不恢復每次 push 全套 CI。真正並行衝突／危險的實驗才暫用短命分支，完成後整理刪除。

**這次 G2 例外：** Judy 已在 [Issue #65](https://github.com/michael-wang/OutRun/issues/65) 的 `task/issue63-option-b-local` 分支進行，保留現有 [Draft PR #64](https://github.com/michael-wang/OutRun/pull/64) 直到 G2 完成總驗收；不要半途要求改 checkout、reset/rebase。驗收整合進 dev 後，核對沒有獨有資料再刪此分支。**下一個核心任務預設直接在 dev 開工**。

**整理待辦（未執行刪除）：** 現有 9 條遠端分支，已合併的 `p0/dot-pipeline-pilot`、`research/p1-1-riviera62` 與已關閉交付測試分支 `test/codex-cloud-delivery-20261115-6af9d406` 為初步清理候選；`spike/p1-2r-visual-first` 仍對應 Draft PR #61 的失敗證據、兩條 `checkpoint/r90-*` 尚須盤點。整理前先查 unique commits／引用／PR，不要盲刪。Judy 可在本輪 G2 完成後一併提出簡短的分支清理清單，**清理不應卡住車輛開發**。

### 2026-11-17 — P1-G2：Judy 自主完成 Option B 外觀一致化（最新優先工作）

Michael 已親自試駕 **Option B** 並接受 [P1-G1 #63](https://github.com/michael-wang/OutRun/issues/63) 為**本機可玩原型 PASS**。G1 的 [Draft PR #64](https://github.com/michael-wang/OutRun/pull/64) **尚未合併到 dev**。**最新授權是 [P1-G2 #65](https://github.com/michael-wang/OutRun/issues/65)**，Judy 應**直接沿用 G1 的 `task/issue63-option-b-local` 工作分支及同一個 Draft PR #64**，而不是從 dev 重新開工；中間不必分段要求 Julia／Michael 驗收，完成三大外觀項後再統一驗收。

**P1-G2 一次完成、按優先順序：**（1）四個輪胎／輪圈＋輪胎上方舊式圓弧輪拱蓋一起替換成現代 GT 造型（**最高優先**，保留轉向、滾動及輪胎接地）；（2）貼合 Option B 車身的現代擋風玻璃、細框與座艙銜接，男女主角不遮擋、男主角握方向盤動作保留；（3）新款細長 LED 前燈＋後燈，黃昏前燈／尾燈常亮與煞車增亮分離。**車尾下方多孔凹凸是 deferred polish，不阻擋本次**。整台車仍只能用 `?hero3d=1` 在授權的本機環境試玩；未帶參數或模型遺失應回到舊版車。保留原本遊戲操控／競速、玩家與女伴、音效與流程。下一次驗收看真的追車畫面（含黃昏）、左右轉彎及完整遊戲，而非每個零件的孤立渲染。

**授權與界線：** Judy 有自行選方法、修改 DCC/小型 runtime adapter、修復、測試的自主權；不必兩輪停工。仍不授權 `main` 發布、不授權將私人 Hunyuan GLB/.blend／參考圖／私人診斷截圖上傳公開 Repo、不擅自付費、改正式物理／女主角或放寬工具安全設定。可交本機可試駕版本＋安全程式/文件 Draft PR，實體素材維持本機私人存放。**正式 Pixel 8 與全球發行授權仍待確認**。詳細：[#65](https://github.com/michael-wang/OutRun/issues/65)。

**歷史註記：** 下方 P1-G1、#62「不准進行 P1-3」「每次只跑一次」的文本是當時的階段 Gate，**不覆蓋最新的 G2 本機可回退整合授權**；Shape 不需重跑，且失敗證據仍保留。

### 2026-11-17 — P1-G1 委派升級：自主完成可試駕 Option B 原型（目前最高優先級）

**Michael 已明確授權 [Issue #63 — Riviera 62 Option B 可試駕原型](https://github.com/michael-wang/OutRun/issues/63)。** Judy 由逐關監督轉為 **Goal Owner**：可以一次自主完成現有 Hunyuan 白模整理、簡單 PBR、保留既有輪胎／方向盤／角色動作、加上可回退遊戲載入 Flag、PC 真正試駕及必要效能處理，最後才提供 Draft PR 和正常追車畫面給 Julia／Michael **一次驗收**。**P1-3 的 dev-only 可切換試駕整合在此 Goal 內獲准，不再要求單獨的每一步人工批准；P1-4 正式 Pixel 8 最終驗收與 main 發布未授權。**

**美術標準已放寬：** 車尾下半部凹凸／多孔瑕疵列為 **DEFERRED POLISH**，不阻擋第一版可玩。可以用簡單深色保桿／擴散器遮蓋或保留後續再修；不因沒有完美 Quad 網格、完美遮罩或 Hunyuan Paint 就卡住。Shape 已在本機 RTX 5070 Ti 成功產生可辨識雙座車體，使用既有 #62 的原始 GLB/.blend 作毛胚，不再重跑遮罩或 Shape。相容的既有操控、車輪、駕駛握盤、女主角 R6d 髮型、交通／競速維持原本可玩。

**保護界線：** 開發只在隔離分支與本機預覽，正式遊戲依然使用舊車作預設及載入回退；`main` 不動。不得未經明確許可把 Hunyuan 原始 GLB／Blender 母檔／使用者圖片等大量二進位證據公開上傳 GitHub（Repository 是公開的）；若原型本地可玩但資產無法公開納版，可先交本地試玩＋安全的程式 PR，清楚記錄缺少的部署資產。Hunyuan 商用地域權利、真機 FPS、發布品質尚未驗收。授權細節及最終 PASS 條件以 #63 為準；下面 #62「Paint 未授權／P1-3 不可開始」等舊文本都是**歷史 checkpoint**，不再是現行工作的阻擋條件。

**最新授權（2026-11-17）：Michael 核准 [Issue #62 透明背景修正後唯一一次 Shape-only A/B 對照](https://github.com/michael-wang/OutRun/issues/62#issuecomment-6926838438)。** 第一版混元 Shape 在 RTX 5070 Ti 上完成，卻把原始**不透明 RGB 圖中的矩形背景**疑似一起生成為大底板，模型 ART FAIL；不是硬體/CUDA 失敗。Judy 現可在本機以原始圖產出真正透明 RGBA 遮罩，**先獨立檢查 mask**，若完整去除畫布／陰影且保住輪胎／座艙，才准固定相同模型/seed/steps再執行 **唯一一次**新 Shape。保存舊候選、比較底板是否消失及車身是否改善。**Paint、Tripo、P1-3 及額外重抽都未授權**，零新增費用，禁止修改遊戲或主分支。

**素材公開限制：**Michael 此次只授權**本機 Shape A/B**，並未授權將原始 GLB、Blender、渲染圖及其他二進位證據公開推上 GitHub；安全審查前次要求的公開揭露許可仍未取得。Judy 可在 #62 留去識別的純文字紀錄與 hash；若要實際移交完整模型，須另行取得許可或走已授權的私人交付。**當前狀態：AUTHORIZED／待 Judy 接手，未宣稱已完成第二次推論。** 下方 Shape→Paint 原方案及 #62 初次候選報告屬當時歷史 checkpoint，以此最新 Gate 為準。

**目前最上層工作（2026-11-17）：Michael 已核准 Riviera 62 的現代 Option B 造型與 [P1-2H 本地 Hunyuan3D 2.1 Shape→Paint 有界實驗 Issue #62](https://github.com/michael-wang/OutRun/issues/62)。** Judy 監督 Local Codex，先取得並核驗 [七張參考圖＋專用單圖輸入](https://chatgpt.com/space/page_cdb53387bb3c8191b794fa168c69ec7a) 的真正圖片 bytes；不能只用預覽或直接把舊 Style B 整張圖片丟入推論。可另從 Julia 對話下載 `riviera62_option_b_reference_pack_2026-11-17.zip` 作本地交接，但 GitHub Issue 需先能獨立核對 SHA-256。這些是 AI 繪製的多視角設計參考，**不是同一模型渲染的幾何正投影**，差異須誠實列出。

**P1-2H Gate：** 先僅做 Hunyuan3D 2.1 Shape-only 一個完整車型，提供真正的 Blender 中性多視角／網格截圖接受外觀檢查；合格再嘗試分離程序的 2.1 Paint（16GB 顯卡可能 OOM），若失敗用 Blender 原生 PBR 備援，不為修 Paint 不斷重裝 CUDA，也不擅自使用雲端付費資源。騰訊模型與輸出的授權限制另行審查，**試驗模型不得直接升為公開全球商用資產**。不修改現有遊戲、主角、物理、`main`、不開 P1-3/4。

**歷史保留：** 原手刻 Blender [#59](https://github.com/michael-wang/OutRun/issues/59) BLOCKED、Visual-first [#60](https://github.com/michael-wang/OutRun/issues/60) ART FAIL、[Draft PR #61](https://github.com/michael-wang/OutRun/pull/61) 部分失敗證據仍保留；兩次修正上限各自用完，不重新開始第三輪。Option A 是未來候選、Option C 不採用；新 **Option B** 取代舊 Riviera 62 外觀方向，但現有 runtime 車在完整下游驗收前仍為預設可玩車。

**最新工作狀態（2026-11-16）：P1-2 [Issue #59](https://github.com/michael-wang/OutRun/issues/59) 在兩次修正後以 STOPPED／BLOCKED 收工，沒有 Draft PR、沒有 Three.js 互動驗證或美術 PASS；Michael 已確認可用母檔存檔，並授權**新的** [P1-2R Blender Visual-first 方法實驗 Issue #60](https://github.com/michael-wang/OutRun/issues/60)。Judy 尚未確認啟動新任務。**原 Issue 的兩次修正額度不得重置；新的研究方法有獨立、同樣最多兩輪的監督限制。** 遊戲 `dev`/ `main` 的 runtime 尚未受 P1-2 影響，P1-3/4 未授權。

**P1-2R 先藝術後管線：** 保留 #59 所有已存檔 .blend、GLB 與診斷；新母檔先做自然連續的 Riviera 62 輪拱／前葉子板，提交可實際審核的 Blender 多角度、黃昏／中性燈與 wireframe 截圖。美術可接受才建獨立輪圈、完整大燈燈殼與發光鏡面，接著做兩次原生編輯／GLB 重匯／允許的 Three.js 離線結構檢查。**不要繞過瀏覽器安全審核，也不要用非瀏覽器測試冒稱 UI PASS。** 只需要可真正重新取得的版本化母檔，不先建立過度複雜的異地備份系統。

**工作狀態記錄：** Judy 開始工作即在 [Issue #60](https://github.com/michael-wang/OutRun/issues/60) 更新 `IN_PROGRESS`；被阻擋更新 `BLOCKED`；可供 Julia 驗收的 Draft PR 確實存在才更新 `AWAITING_JULIA_REVIEW`。這是 GitHub 的正式資訊來源，不要求 Michael 再替兩位 AI 傳送聊天截圖。下方 #59「P1-2 已授權待 Judy 接手」為先前歷史狀態，不能作為繼續舊方法施工的許可。

**最新工作決策（2026-11-16）：Michael 已授權 [P1-2 第一個 Riviera 62 Blender 母檔／GLB／離線 Three.js 切片](https://github.com/michael-wang/OutRun/issues/59)，交由 Judy 監督本機 Codex；正式接手／結果仍待回報。** P1-0／P1-1 均 PASS，P1-3／P1-4 未授權。這輪只做單側前輪、輪拱、大燈與紅色局部車漆的真實可編輯 Blender 模型，兩次修改重匯並離線測試獨立輪組／燈光材質；不觸碰現有遊戲角色、物理、主車 runtime、main 或部署。

**後續獨立議題（暫緩）：** Michael 提出 Y 軸 Yaw 的轉向中心與漂移時車頭朝向／行進方向分離。前輪轉角不等於把整輛車固定繞前軸旋轉；GLB 的 vehicleRoot 是建模座標選擇，不是物理轉彎圓心。後續應在獨立賽車手感檢討中研究軌跡、轉角、Slip Angle 與現有整車 Roll／輪胎貼地；P1-2 只保留獨立 wheelMount 和 sprungBody，不改 Yaw 演算法。下面「P1-2 未授權」為歷史快照，現行權限以 [Issue #59](https://github.com/michael-wang/OutRun/issues/59) 為準。

**目前最新（2026-11-16，P1-1 Julia 獨立驗收）：P1-1 RESEARCH 技術 PASS，已合併 [PR #58](https://github.com/michael-wang/OutRun/pull/58) 到 dev；[Issue #57](https://github.com/michael-wang/OutRun/issues/57) 已按「研究完成」結案。** 本專案仍是 Riviera 62 資產生產流程 **L1 未完成證明**，尚未製作 Blender 主車片段、匯出/匯入 GLB 或實測 Pixel 8。Julia 的審查與下一關約束見 [P1-1 final review](https://github.com/michael-wang/OutRun/pull/58#pullrequestreview-5918256565)。

**下一個 P1-2 只有候選方案，尚未取得 Michael/Julia 施工授權。** 候選是前輪／輪拱／大燈／局部車漆的可編輯 Blender 母檔→GLB→離線 Three 載入實驗。先用最簡單可還原的版本管理保存母檔、設計圖、設定與 SHA；複雜異地雙服務備份、完整遊戲鏡頭自動重播和真機門檻保留到 L2／P1-3／P1-4，不應卡住第一個 L1 切片。不得宣稱真正車模管線已通過，或解凍女主角／關閉 Issue #45。Judy 未來須記錄 Codex 推理強度實際套用或明說無法驗證。

**現行狀態（2026-11-16，Julia 獨立驗收）：P0 Pilot 技術與治理範圍 PASS，PR #56 已於 2026-11-16 合併到 dev。** [最終 Review](https://github.com/michael-wang/OutRun/pull/56#pullrequestreview-5915763479) · [合併 PR](https://github.com/michael-wang/OutRun/pull/56) · [Linux GitHub Actions](https://github.com/michael-wang/OutRun/actions/runs/43812289125) 。P0-1 的 14 個 Issue 分類同步成功，全部維持 OPEN；P0-2 Asset Manifest、P0-4 Task Contract 為有限度技術 PASS，P0-3 為政策與同機還原試驗 PASS。**尚未完成真實 Blender／音樂母檔的版本化與獨立備份，未宣稱 L3/美術/Pixel 8 發行就緒。** 本頁後續 checkpoint 的「未推送、未同步、待驗收」均為保留的當時歷史快照，不是現況。P1/P2 尚未啟動。

**決策日期：2026-11-15 深夜至 2026-11-16（台灣時間）**  
**狀態快照（2026-11-16 UTC 本地審查 checkpoint 當時）：P0-0 維持原驗收紀錄；P0-1 的 14 個 Issue 派工分類已同步並獨立回讀，全部 OPEN，最終驗收當時待 Julia；P0-2/3/4 維持 bounded technical PASS。當時 PR #56 為 Draft、base dev，Linux 手動驗證通過；文件增補僅在本地提交，尚未 push／更新 PR 描述。後續交付現況以 [PR #56 實際 head／描述](https://github.com/michael-wang/OutRun/pull/56) 為準，最終驗收須有明確 review 紀錄；本快照不宣稱後來已推送或完成最終審查。**
**適用：第一關「海濱公路」在 dev 分支的製作；main 僅在 Michael 明確核准後更新。**  
**使用方式：每次派 Codex 任務、驗收、收工盤點時，先查本文件，更新進度/證據/下一步。不得把「提交完成」當成「美術或 Pipeline PASS」。**

**現況證據：** [最新 closeout addendum](DOT_P0_PILOT_REPORT.md#current-closeout-addendum--2026-11-16-utc)、[Julia review](https://github.com/michael-wang/OutRun/pull/56#pullrequestreview-5914717721)、[Linux run 43812289125](https://github.com/michael-wang/OutRun/actions/runs/43812289125)。下方各 checkpoint 的「未同步／禁止修改／尚未 push 或建立 PR」是當時有效的歷史紀錄；後來 Michael 明確條件式授權、Linux 驗證及同步結果見末尾追加紀錄，不能用後來成功抹去先前拒絕。此狀態不解除 #45、母檔備份、美術或 release 關卡，亦不啟動 P1/P2。

### 2026-11-16 — P1-1 正式授權 / Judy 接手前狀態

**Michael 明確確認 P1-0 PASS，授權 Judy 監督本機 Codex 啟動 [Issue #57：P1-1 Visual / Tool / Interface RESEARCH](https://github.com/michael-wang/OutRun/issues/57)。** Issue 已建立，權威來源為本 Tracker、[已核准的 P1-0 Brief](P1_RIVIERA62_PIPELINE_BRIEF.md) 與 P0-4 Task Contract。**這只是正式派工就緒，Judy 是否已啟動 Local Codex 仍待確認**，不能把 issue 創建當作工作的進展或 PASS。

- **P1-1 本輪目的：**盤點已存在的 Riviera 62 方向盤／右手握盤左手靠門／四輪 pivot／車漆與煞車尾燈接口；比較 2–3 條 Blender DCC 建模工具與可修改、重匯方案；提出燈光分離、未來左右不同懸吊行程的 Hierarchy 與首個 P1-2 小切片建議。
- **Judy 必須執行：**啟動前檢查本機環境／Git 交付、按任務難度選 Codex Reasoning Effort（Low 例行盤點、Medium 預設、High 需具體理由、Extra High 需批准），每階段讀 Diff／測試，最多兩輪具體修正，維持真實尚未驗證項目。
- **限制：**研究／文件／必要非破壞檢查而已；不能新建正式車模、修改 `src/`、`public/assets/`、`content/`、更新 `main`、直接開始 P1-2、動女主角或做手機發布測試。完成後提交指向 `dev` 的 Draft PR，等待 Julia 與 Michael Review。
- **交接方式：**Issue 與 GitHub 為工作交接事實來源，尚未取得可直接喚醒 Judy 的本對話操作。須由 Michael 在 Judy 對話中轉達「開始執行 Issue #57」；沒有連線成功回執前，不宣稱她已接手。

### 2026-11-16 — P1-0 Riviera 62 新增下游需求與 Brief（不授權施工）

**Julia 已將 [P1-0 主角車製作流程驗證 Brief](P1_RIVIERA62_PIPELINE_BRIEF.md) 寫入 dev，等待 Michael 確認；僅是規格完成，沒有新模型、GLB、遊戲程式、P1-1 施工或 Pixel 8 驗證。**

- **方向盤：**保留現有男主角右手握盤、左手靠門與正反轉向的功能，要求 DCC 模型有穩定轉向軸、輪胎／乘坐接點；不重新製作人物。
- **燈光：**黃昏／偏暗時主車能啟用前大燈並讓後方位置尾燈常亮；煞車增亮與方向燈保留獨立語意。既有 `dusk` 弱尾燈不是完整驗證。
- **懸吊：**車體側傾及左右輪不同壓縮留待未來優化；第一版只守住車體／四輪獨立可動 Hierarchy，不建複雜物理。
- **Judy 的 Codex 推理強度：**Low 用於例行盤點，Medium 作常態，High 用於真正複雜且高返工風險的選型/根因；最高檔只在證明必要並取得核准時使用，並於每張任務記錄理由與實際設定。
- **下一個 Gate：**由 Michael/Julia Review P1-0，之後才另行授權 P1-1 Visual／Tool／Interface Spike。女主角仍凍結，P2 尚未啟動。

## 0. 我們究竟在做什麼

短期北極星是類似 SEGA OutRun 2 的街機賽車**體驗**，不是角色展示或技術展示：

1. **賽車為主**：好玩的速度感、甩尾、競爭、超車、風險與追趕機會，最優先。
2. **多樣化場景為輔**：讓玩家在高速奔馳中享受海岸、漁村、帆船灣與其他英雄景觀；風景支援賽車的情緒節奏。
3. **額外駕駛樂趣為後續方向**：吃金幣、衝撞指定車輛、障礙賽等。這是 *future experience backlog*，不是目前核准的實作工作。

**角色製作降溫：**保留現有可玩的女主角、既有動作及俏麗會隨風飄逸的 R6d 金色短髮，不再將全身比例、衣服細節、複雜動作、臉部表情作為當前優先工作。保留 MPFB、Hunyuan3D、R7H 試驗成果及失敗紀錄，待場景製作流程成熟、第一關有相當完成度後，再研究角色能否成為提升重玩性的魅力來源。**不倒退現有遊戲能力；尚未完成的 Pixel 8 頭髮效能關卡也不能假裝通過。** 如有嚴重回歸問題可另外處理修復。

**預算政策更新：**舊「額外支出 NT$0」指令不再是普遍限制。可以研究付費工具/服務；購買前需提出具體瓶頸、替代方案、試用驗證、授權與總成本，由 Michael 決定。不得未經核准直接購買或呼叫付費 API。

**Game Experience Roadmap：**認可其價值，但刻意延後。在 P1 / P2 初步驗收或第一關下一次整體體驗檢查時，由 Julia 主動提出輕量藍圖；不要現在展開第二關或追加角色系統。

## 1. 本次事後檢討：根因與修正

- Codex 容易採用 TypeScript/Blender Python 手刻幾何直接滿足字面視覺結果；**方法是否能承受後續需求**未成為硬性驗收。
- 程式化幾何並非錯誤：道路、地形、重複靜態物件、簡單剛體變換、材質/打光/陰影可很合適；**複雜可變形人物**則應優先驗證 DCC 網格、拓樸、骨架、蒙皮、Corrective Shapes、動畫/表情與效能的整條工具鏈，不以多加幾何程式碼代替驗證。
- Hunyuan3D 是候選雕塑/靜態物件製作工具，並非已驗證的完整角色動畫管線。MPFB 人體基礎有 L1 成果，但衣服抬手變形失敗；不等於角色量產成功。
- 已有規範文件卻沒有強制執行；根目錄 AGENTS.md 堆積過時的「CURRENT」任務、舊成本限制和與現況不符的指令。**本文件及其後續明示修訂在當前製作優先順序上優先於舊歷史段落**；P0 應正式整理文件權威性與自動檢查。
- Julia 必須在派工前補全 Michael 未必能預見的下游需求，審核方法而非僅交付外觀，必要時明確說「流程未掌握」並中止低效修補。
- 重要資產要保留 **source of truth**：可編輯設計與 Blender 母檔、正式模型、音樂/音效源與來源授權。大量 Review 證據不應永久污染 Repo；經驗證清理機制建立前不得盲刪。
- Dot 可作為持續協調/回收結果的候選，但不得被授權無限制修改/重試，重大藝術、架構、工具、成本決策仍需 Julia / Michael 的關卡。

## 2. 製作能力等級（必須分「遊戲功能」與「資產生產流程」評級）

| 級別 | 意義 | 可做什麼 |
| --- | --- | --- |
| **L0 未掌握** | 只有構想、工具候選或存在失敗 | 研究/Spike；不准正式量產 |
| **L1 原型可行** | 單次產出或局部技術可用 | 端到端驗證，不准大量做資產 |
| **L2 流程驗證** | 從原始可編輯資產 → 合法來源 → 匯出 → 遊戲中的所需動作/光影/效能走完 | 有界限的小批試產 |
| **L3 量產就緒** | 能重複製作/修改、重現、追溯、優化、有一致品質與資產守門機制 | 大量製作 |

**狀態註解：**等級是資產生產流程的成熟度，不是遊戲功能品質分數。沒有相應下游需求及手機實測時，不准直接升級。自動測試通過≠美術驗收；錄影 30 FPS≠Pixel 8 遊戲 FPS。未知＝未驗證，不是 PASS。

### 首輪能力盤點（暫定，以後依證據更新）

| 資產/能力 | 初始評級 | 已知事實／主要缺口 |
| --- | --- | --- |
| 道路資料驅動、競速及交通的現有**功能** | 功能 L2 | 可玩、有測試；長程實機及新賽道重用仍應驗證 |
| 道路/海岸/夕陽/風場的**製作流程** | L1–L2 | 部分可重現，尚未證明整體新場景量產 |
| Asset Library → Scenic Package → Stage Layout | **L1** | 有九個 hero anchors，但僅一個 rural-hamlet-pilot package、一棟 farmhouse；大型地形、舊 TS 生成器未完整納入 |
| 靜態船、房子、農田、樹木 | **L1** | 有 GLB/生成原型；仍缺一致風格、放置與移動、可重複生產證明 |
| 道路設施/護欄/事故物件 | **L1** | 現有玩法能用；統一 GLB 美術與碰撞分離尚未全面驗證 |
| Riviera 62 及 rival/traffic **美術資產** | **L1** | 遊戲中可玩，很多造型仍由 TS 幾何建立；正式 DCC 母檔→GLB→遊戲的重複流程未經驗證 |
| 女主角 MPFB 底模 | **L1** | Issue #53 人體、53 骨、基本姿勢已證明；不是完整角色 |
| 女主角服裝 | **L1 / deformation FAIL** | Issue #54 獨立衣物原型；抬手腋下拉成翅膀，站姿局部穿模 |
| 女主角現有頭髮與遊戲動作 | 遊戲功能已存在；Pipeline **L1** | R6d 風髮和 R7H 動作保留；可重複製作、髮絲與服裝互動及 Pixel 8 效能尚待驗證 |
| 男主角正式角色與臉部表情 | **L0–L1** | 候選方案存在，未證明完整可擴充角色流程 |
| 音效事件整合 | 功能 **L2** | 引擎、甩尾、事件音已有；正式配音/原始音樂製作流程未驗證 |
| 原始美術資產 Source Control | **L0** | tracked repo 目前沒有 .blend 母檔；部分 C: 原始檔僅本機，需版本化與備份規格 |
| Codex/CI Pipeline 守門 | **L0** | 有 AGENTS/測試，仍欠資產 Manifest、關卡與每日狀態追蹤 |

## 3. 當前已核准的執行順序（不得跳關）

| ID | 優先序／工作 | 狀態 | 交付／PASS 條件 | 責任 |
| --- | --- | --- | --- | --- |
| **P0-0** | 固化決策與防止舊指令繼續派工 | **PASS — Michael 2026-11-16 驗收** | 本 Tracker 作為當前單一行動清單，根目錄 AGENTS 明示優先級；不改遊戲 | Julia |
| **P0-1** | Pipeline Authority / 文件與 Issue 盤點 | **2026-11-16 UTC checkpoint：14/14 SYNCED；final review 當時 pending** | 文件權威與 14 項派工分類已整理／同步，原 body 與未知保留，全部 OPEN；不等於原問題已完成或美術／裝置驗收 | Julia + Codex |
| **P0-2** | Asset Manifest + 最小自動守門 | **PASS (technical) — Julia independent review** | 定義原始檔/版本/授權/製作工具/輸出/動作需求/驗收等級，新增有測試的驗證命令；缺來源不得標 L3，不誤傷 legacy | Codex，Julia 審查 |
| **P0-3** | Source Control & evidence lifecycle | **PASS (technical scope) — Julia independent review** | 設計圖、.blend、音樂等重要創作母檔納入版本管理（大檔評估 Git LFS/獨立資產儲存及備份）；正式 GLB/部署先驗證相容性。臨時截圖/影片設定可追蹤但可到期的存放、驗收後移除。不得直接批次刪歷史證據 | Julia + Codex |
| **P0-4** | Codex Research vs Production 關卡 | **PASS (technical scope) — Julia final independent re-review** | 每張任務標明型別、當前與下游需求、所選工具/原因、停止條件、測試、效能、藝術驗收、反例/缺口；兩次同類補丁無根因時強制策略檢討 | Julia + Codex |
| **P1** | Riviera 62 DCC → GLB → Three.js 小型端到端實驗 | **P1-G3 prototype PASS；P1-G4 #68 已授權無參數預設新車，全球 main 發行待合法資產／真機驗證** | Judy 讓日常遊戲與 PWA 本機發行預覽無需 hero3d 直接載入新車；舊車為 QA/失敗 fallback；GLB 真實打包與 Hunyuan 地域商用發行權需明確處理 | Julia 規格、Codex 製作、Michael 驗收 |
| **P2** | 一組代表性景點 Asset → Package → Layout 試驗 | **Michael 已授權 P2-G1 #67 海水浴場；5,980m 暫定，不是工作港口** | 墾丁記憶的海水浴場完整場景：沙灘／淺水／遊客／彩色傘及夕陽海岸；Asset→Package→Layout 可搬動；局部岸線與 Ultra Water 同步配合、真實追車畫面驗收 | Julia 規格、Codex 製作、Michael 驗收 |
| **G1** | 輕量 Game Experience Roadmap | **DEFER** | P1/P2 取得初步能力證明、或第一關下一次整體體驗檢討時再提；聚焦賽車/多景/駕駛小遊戲，不提前開做 | Julia + Michael |
| **CH1** | 女主角進一步動作／表情／服裝精修 | **ON HOLD** | 第一關場景製作成熟後，重新定義最終情境與角色完整 Pipeline Spike；現行可玩的 R6d 髮型與能力保留 | Julia + Michael |
| **R1** | Pixel 8 重要效能關卡 | **OPEN BLOCKER** | Issue #45 R6d/WILD 真機證據尚未通過；不要誤以為角色已 release-ready | Codex 收集，Michael 實機確認 |

**優先順序定義：** P0、P1、P2 是「完成製作能力」的關卡，不是無限制重構。P0 建立最小真正可執行的制度就進入 P1，不要花好幾週只整理文件。P2 的前置技術研究可做，但不在 P1 未確認時大量生產。

## 4. 每張 Codex 任務應具備的最小契約

1. **Type**：RESEARCH / SPIKE 或 PRODUCTION，不能混淆。
2. **Why**：對「賽車第一、風景第二、駕駛樂趣第三」的直接貢獻。
3. **Downstream requirements**：後續的變形/動畫/素材替換/重用/LOD/風場/聲音/平台能力，即使尚未實作也要提前辨識。
4. **Source of truth**：設計圖、資產母檔、授權來源、資料位置（場景套件不能藏 HUD 公尺）。
5. **Evidence**：可編輯母檔、重現命令、精確場內實拍、測試結果/尺寸/效能；未知直說。
6. **Stop/Fail**：失敗也應交出原因、保留候選，不可偷換成 TS/Blender Python 拼湊滿足字面要求；任何替代方法需 Julia 審核。
7. **Approval**：技術 PASS ≠ 美術 PASS ≠ Michael 接受 ≠ release PASS。不得自行改 main 或宣稱完工。

工具選型採「用途適合且可支援下游」；程式化幾何仍可用於合適的靜態/可參數化資產，但不應用漂亮的靜態截圖掩蓋動態角色製作失敗。

## 5. 問題與紀錄衛生（每天收工時查）

**目的不是強迫 Open Issue = 0，而是狀態不明 = 0。** 每次收工 Julia 要依最新 GitHub 列出：

- **待 Michael 驗收**：什麼版本/畫面/玩法？到底是未驗收、PASS、FAIL？
- **待修／留隔天**：阻礙、下一步、負責者、優先級、是否值得繼續。
- **已驗收可結案**：關閉或合併後清除短期證據，保留必要原始創作母檔和精簡決策/失敗結論。
- **舊歷史／重複 Issue**：標 superseded 或 close with reason；不得在未確認時自動關閉。

**2026-11-16 起始快照：** dev @ 3fe62dc；14 個 Open Issues、1 個 Draft PR，尚未逐一清理。與 Pipeline 特別相關：#54 服裝變形失敗（HOLD）、#49/#50/#51 角色歷史工作（待盤點）、#45 Pixel 8 頭髮效能（BLOCKER）、#34 道路→Blender→GLB（P2 依賴）、#35 農舍試產（P2 候選）、#32 起步 lag（保留）。不以現有 open 狀態推斷一定未完成。當天未明確回覆驗收不等於自動通過。

### 追蹤更新格式（每次實際變更時追加）

| 日期 | 項目 | 原狀態 → 新狀態 | 證據（commit / issue / 來源） | 下一步／阻礙 |
| --- | --- | --- | --- | --- |
| 2026-11-16 | P0-0 | 文件建立、待驗收 → **Michael PASS** | [098da47](https://github.com/michael-wang/OutRun/commit/098da47c485cb9521a6fb9c66b2e8bccd1f733b4) | 後續交由 Dot 試行監督 P0-1…P0-4 |
| 2026-11-16 | P1 / P2 / CH1 | 新決策 → P1/P2 待驗證、CH1 ON HOLD | 2026-11-15/16 Michael–Julia 會議共識 | 不先花算力在角色精修 |

### 2026-11-16 — Dot × Codex P0 pilot handoff

Michael 明確同意以 **Dot 擔任 Codex 監督者**試行 P0-1…P0-4，完成後由 Michael + Julia 獨立 Review。詳細邊界、逐關 PASS 條件、兩次補丁停止規則、Draft PR 與監督績效報告要求，見 [Dot P0 Pilot Brief](DOT_P0_PILOT_BRIEF.md)。**此為原始 handoff 狀態；目前進度見下方 P0-1 checkpoint。** P0 工作請在從 dev 分出的獨立分支進行；不得自動合併到 dev/main。

| 日期 | 項目 | 狀態變更 | 證據 | 下一步 |
| --- | --- | --- | --- | --- |
| 2026-11-16 | P0-1…P0-4 | TODO → Dot Pilot QUEUED（未執行） | [Dot Pilot Brief](DOT_P0_PILOT_BRIEF.md) | Michael 在 Dot 對話中交付文件；Dot 啟動 Codex 小步驟並留下獨立審核報告 |

**重要：** 更新本表時亦更新上方任務狀態。每個受影響的 Issue 必須反映同一個狀態；不只寫文件卻不改實際派工.


### P0-1 checkpoint — bounded handoff (2026-11-15 UTC / 2026-11-16 Taiwan time)

Type: **RESEARCH / documentation governance**. Branch: `p0/dot-pipeline-pilot`; base: `e81272a0e3295c942ece8b3d305bc49b0337fbe0` (remote dev verified at start). [Evidence, authority map and all issue/PR dispositions](DOT_P0_PILOT_REPORT.md).

| 項目 | 狀態變更 | 證據／下一步 |
| --- | --- | --- |
| P0-1 | QUEUED → **PARTIAL / independent review pending** | 14 open issues + 1 draft PR inspected; local documentation checkpoint only. Julia/Dot must independently inspect actual diff and checks. |
| P0-2–P0-4 | **NOT STARTED** | Michael authorized all four stages and the final Draft PR. Julia temporarily paused progression at the P0-1 review gate; later stages await bounded delegation, not renewed Michael authorization. |
| GitHub issue synchronization | **BLOCKED — automatic approval review** | Julia accepted the 14 body prefixes and directed execution. #6 update and one evidence-supported retry denied; all 14 issues re-read and unchanged. Zero successful writes; remaining 13 not attempted. See report for exact reasons and verification. |

No new owner/art/device/release PASS. #45 remains BLOCKED. No push, PR, issue closure/deletion, gameplay/asset/version change or paid calls performed. **Correction pass 1:** Julia identified and rejected the mistaken attribution of the P0-1-only pause to Michael. Michael’s full P0-1–P0-4/final-Draft-PR authorization remains valid; Julia’s temporary checkpoint review governs current execution. Julia accepted correction pass 1 and the exact issue prefixes, then directed synchronization. Live synchronization remains **unfulfilled / BLOCKED** because automatic approval review denied the #6 body update and one retry after retrieval of Michael’s original authorization. All 14 issue bodies/metadata were re-read unchanged; no other writes attempted. The report records exact rejection reasons, evidence and results. Next: Julia independently verifies this checkpoint and resolves the tool’s explicit-authorization block. No P0-2 or push before that verification.


### P0-2 checkpoint — independent work while issue sync is blocked

Julia explicitly delegated **PRODUCTION/tooling P0-2** after accepting the P0-1 authority correction. P0-1’s automatic-approval block is preserved; **no retry or further issue writes**. Latest remote dev remains `e81272a0e3295c942ece8b3d305bc49b0337fbe0`; work continues on the same independent branch from checkpoint `e3ca36090634e75bacf3aa91d79eec41aeb30d82`, with no conflict or uncommitted changes at start.

| Item | Status | Evidence / next action |
| --- | --- | --- |
| P0-1 | **PARTIAL / live sync BLOCKED** | No live edits succeeded; do not retry. Earlier checkpoint tables above are historical stage snapshots. |
| P0-2 | **PARTIAL / independent review pending** | [Manifest contract](ASSET_MANIFEST_PILOT.md), [one opt-in R6d pilot](../asset-pipeline/pilot.json), validator and 36 passing focused tests. Positive metadata check and deliberate negative production promotion tested. No new visual/device/owner approval. |
| P0-3 / P0-4 | **NOT STARTED** | Stop after P0-2; await Julia’s next bounded delegation. No push. |

Only metadata, isolated validation/tests, npm command entries and status documentation changed. No legacy-wide enforcement, gameplay/assets/version change or paid calls. Validator success checks referenced bytes and review records; it cannot authenticate reviewer assertions or prove art/license/device acceptance. Full limitations and exact commands/results are in the [pilot report](DOT_P0_PILOT_REPORT.md).


**Latest Michael clarification (during P0-2):** do not modify any of the 14 public Issues now, retry, or bypass approval review. They change outside the Draft PR. Keep P0-1 **PARTIAL**, branch-local dispositions/recommendations and the unsynchronized state, plus the actual authorization errors for the final supervisor evaluation. Michael + Julia will review these after the full P0 Draft PR. This supersedes the earlier proposed next step of obtaining approval and retrying issue synchronization; continue only the current bounded P0-2 checkpoint, then stop for Julia’s review.


### P0-3 checkpoint — source inventory and local restore trial

Latest dev re-read: unchanged `e81272a0e3295c942ece8b3d305bc49b0337fbe0`. Clean starting pilot checkpoint `30d2fea0693f86c20cbb023825cbdd9b2a6f2176`; no conflicts. Julia independently inspected P0-2’s actual manifest/validator/tests/package diff/docs and reran both commands (36 tests pass, intended invalid CLI exit 1) plus whitespace checks. She reports an adversarial malformed/false-L3/missing-source/path review with no blocking defect. **P0-2 technical PASS only**: no reviewer authentication, source-editability/license proof or art/device acceptance. Windows was not tested; symlink tests may require privileges.

| Item | Current status | Evidence / next action |
| --- | --- | --- |
| P0-1 | **PARTIAL / unsynchronized** | Preserve actual approval errors. Michael says no public Issue changes or retries; review recommendations after full P0 Draft PR. |
| P0-2 | **PASS (technical only)** | Independent review above; limitations retained in [contract](ASSET_MANIFEST_PILOT.md). |
| P0-3 | **PARTIAL / independent review pending** | [Inventory, deployment analysis and retention proposal](ASSET_STORAGE_AND_RETENTION.md); [five-file trial result](P0_3_STORAGE_TRIAL.json). Same-machine restore is not backup proof for inaccessible Windows masters. |
| P0-4 | **NOT STARTED** | Stop after P0-3 for Julia review; no push. |

No migration/LFS configuration/history rewrite, upload, deletion, gameplay/art/config/version change, cost or Issue mutation. Actual source-backup coverage remains UNKNOWN; recommended future one-master native restore and independent storage choice require a separate bounded decision, not an inferred PASS.


### P0-4 checkpoint — task contracts and enforced prerequisite records

Julia independently read P0-3 inventory/deployment analysis/full restore script and diff, reran the five-file trial against `30d2fea` (PASS, unchanged status) and whitespace check. She reports an additional reviewer reran trial/refusal tests and inspected Netlify/Pages workflows with no blocking defect. **P0-3 technical scope accepted only**: same-machine byte restore, not native editable-master recovery, independent backup, LFS hydration or live deployment. No migration/deletion approved.

P0-4 starts from `749f35ac8bc8d7f110c7566dbcb9fedbcee4436d`; remote dev still `e81272a0e3295c942ece8b3d305bc49b0337fbe0`, clean start, no conflicts. [Contracts](TASK_CONTRACTS.md) and [Riviera 62 example](../asset-pipeline/riviera62-task.example.json) cover relevance/downstream/source/tool/stop/commands/failure evidence and separate approvals. An opt-in local checker rejects production with missing capability/approval records, example-only/nonproduction type or unresolved review at two completed correction passes (more than two is a violation); a separate correction-dispatch check prohibits the third correction; it never executes task commands. Targeted positive/negative tests and exact results are in the [report](DOT_P0_PILOT_REPORT.md).

P0-1 remains **PARTIAL/unsynchronized**, no public Issue edits or retries. P0-2/P0-3 remain technical PASS with limits. P0-4 is **PARTIAL, independent review pending**; no P1/P2 execution, art/device/owner/release acceptance or push. Clearing record checks is not execution authorization. Stop for Julia review before the final Draft PR handoff.


**P0-4 correction pass 1 (pending independent re-review):** Julia reran the original 10 tests and production example (exit 1 / 12 blockers); an adversarial review found hashed receipts with explicit failed outcomes were accepted. Corrected the machine-detectable contradiction: requirement receipts now require `result: "pass"`, approvals require `result: "accepted"`; missing/failed/incompatible results reject. The Brief's two-pass pilot cap now stops dispatch regardless of `rootCauseResolved`, distinct from future same-method policy. Regression tests reproduce both defects and pass after repair; exact commands/results are in the report. No P1/P2 or Issue work; P0-4 remains PARTIAL pending re-review.


**P0-4 correction pass 2 — final, pending independent re-review:** Julia accepted the receipt-result repair and reran 11 tests, then identified that correction-pass count was incorrectly treated as a permanent production blocker even after a successful accepted second pass. Now `--correction` always forbids a third correction; `--production` permits advancement at exactly two only with resolved findings and recorded independent acceptance plus all normal prerequisites. Above two is a violation regardless of resolution/review. Neither state field authenticates review. Targeted tests cover two resolved/unresolved, pending/rejected/accepted review, and three passes with either resolution value; receipt checks remain intact. This is the final P0-4 correction pass: stop for review, no further correction dispatch or P1/P2/Issue work.


### Final P0 branch review-ready status

P0-1 **PARTIAL / unsynchronized**; P0-2, P0-3, P0-4 **PASS (technical scope only)**. Julia's final P0-4 re-review inspected actual correction code/diff and reran **14 task tests + 36 asset tests + whitespace check**, all passed. Receipt failures/missing/incompatible outcomes reject; second-pass advancement and third-correction dispatch are separated; >2 remains a violation. Both correction passes and Julia's acknowledged over-restrictive pass-1 instruction are preserved in the [final report](DOT_P0_PILOT_REPORT.md). No third P0-4 correction is allowed.

Technical PASS authenticates neither human approvals/claims nor actual car abilities, source editability/license, visual/device acceptance, independent backups or live deployment. P1/P2 remain unperformed. Current task: final docs/status only, then **Julia final diff review before push and Draft PR into dev** under Michael's existing authorization; no merge. All stage-specific stop instructions above are historical checkpoint records. Michael's no-live-Issue-edit direction remains active; actual denials and unsynchronized recommendations remain for full Draft PR review.

### 2026-11-16 UTC — closeout update after Linux verification and Issue synchronization

本節與頂部狀態記錄 2026-11-16 UTC 本地審查 checkpoint 當時的事實；前述 pre-publication、Windows 未測與 Issue 禁止修改段落保留為歷史。當時 PR #56 遠端 head 為 `df6a198f38188fe44a288b56c383ea78e2151987`、Draft、base dev；原始十個 SHA 完整保留，後接 Windows 修正 `450896e` 與 Julia 的 manual-only workflow `df6a198`。初次文件提交 `b01f5692f5ed01708b94aa1813d173f8e867a1f2` 以 `df6a198` 為 parent，交付本地審查時尚未 push；原本使用者 checkout／未提交檔案保持原狀。後續交付請查 PR 實際 head／描述及明確 review，不從這份歷史快照推定已推送或已驗收。

| 項目 | 已核實變化／證據 | 尚未完成／下一步 |
| --- | --- | --- |
| Windows 相容性 | 真實 symlink containment 與 CRLF hash 問題已修正；36 asset + 6 portability + 14 contract 全過，獨立 reviewer 亦報告 scoped rerun 全過 | [原失敗及 exact TAP](P0_WINDOWS_COMPATIBILITY.md) 完整保留；先前 junction EPERM 與後來 approved scoped execution 分開記錄，沒有弱化測試 |
| Linux 一次性手動驗證 | [43812289125](https://github.com/michael-wang/OutRun/actions/runs/43812289125)，attempt 1，SHA `df6a198`；assets:check、36+6+14 全過；verify build、44 P0、47 advisory tests 全過；parent 已獨立核實 jobs/logs | 實際 Ubuntu 26.04／Node 22.23.4；平台及 bundle-size 警告見報告。未執行完整 verify:dev／裝置／美術驗收；本文件提交不是該測試 SHA |
| P0-1 live synchronization | Michael 後來的明確條件式授權與 Julia review 前置關卡完成後，parent 回報經同一 update_issue connector 成功同步；本 worker 對原提案與 pre-sync 快照逐字比對 14/14 通過，十則留言與其他欄位未變 | 全部 OPEN：SUPERSEDED #6/#14/#49/#50；NEEDS_OWNER_REVIEW #7/#9/#33/#51；HOLD #20/#32/#34/#35/#54；BLOCKED #45。此為派工狀態同步，非完成／關閉原問題 |
| 審核與失敗歷史 | 先前 #6 兩次自動審核拒絕、回讀未變、其餘 13 未嘗試及後來禁改指令原文保留；後來成功是新授權後的獨立事件，parent 回報未換工具繞過 | 本 worker 本輪只讀核實 Issues，沒有重試／寫入；不得把歷史拒絕改寫成成功 |
| P0-3／P0-4 邊界 | 同機五檔 byte restore 與 opt-in record checker 的 technical PASS 維持 | 真實可編輯母檔獨立備份仍未證明；沒有全域強制守門／人類審批認證，沒有 P1 能力或來源授權 PASS |
| 本地文件 handoff（2026-11-16 UTC 當時） | 僅 Tracker／report 現況增補；歷史 report、Windows 失敗、兩次 P0-4 修正及 supervisor 自身修正原因保留 | 當時停止等待 Julia 審查 diff／證據，push／PR 描述更新尚待處理；後續交付依 PR 實際 head／描述與 review 核實。這份紀錄不授權合併、dev/main 變更或 P1/P2 |

完整時間、job links、逐 Issue updated_at、監督與驗證責任歸屬見 [驗收報告最新增補](DOT_P0_PILOT_REPORT.md#current-closeout-addendum--2026-11-16-utc)。P0 最終驗收不自行宣告；#45 Pixel 8 release gate、角色 HOLD、來源／備份／裝置／美術未知仍保留。
