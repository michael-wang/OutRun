# 極速漫遊｜製作流程重整與 Action Tracker

**決策日期：2026-11-15 深夜至 2026-11-16（台灣時間）**  
**狀態：P0-0 維持原驗收紀錄；P0-1 PARTIAL／Issues 未同步；P0-2 PASS（technical only）；P0-3 PASS（technical scope only）；P0-4 task-contract checkpoint 待獨立審查。**
**適用：第一關「海濱公路」在 dev 分支的製作；main 僅在 Michael 明確核准後更新。**  
**使用方式：每次派 Codex 任務、驗收、收工盤點時，先查本文件，更新進度/證據/下一步。不得把「提交完成」當成「美術或 Pipeline PASS」。**

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
| **P0-1** | Pipeline Authority / 文件與 Issue 盤點 | **PARTIAL — live issue sync BLOCKED** | 梳理過時「CURRENT」、權威文件與互相矛盾的規格，舊 Issue 標記 current/hold/superseded/blocked，不假裝已驗收 | Julia + Codex |
| **P0-2** | Asset Manifest + 最小自動守門 | **PASS (technical) — Julia independent review** | 定義原始檔/版本/授權/製作工具/輸出/動作需求/驗收等級，新增有測試的驗證命令；缺來源不得標 L3，不誤傷 legacy | Codex，Julia 審查 |
| **P0-3** | Source Control & evidence lifecycle | **PASS (technical scope) — Julia independent review** | 設計圖、.blend、音樂等重要創作母檔納入版本管理（大檔評估 Git LFS/獨立資產儲存及備份）；正式 GLB/部署先驗證相容性。臨時截圖/影片設定可追蹤但可到期的存放、驗收後移除。不得直接批次刪歷史證據 | Julia + Codex |
| **P0-4** | Codex Research vs Production 關卡 | **PARTIAL — tooling checkpoint，待獨立審核** | 每張任務標明型別、當前與下游需求、所選工具/原因、停止條件、測試、效能、藝術驗收、反例/缺口；兩次同類補丁無根因時強制策略檢討 | Julia + Codex |
| **P1** | Riviera 62 DCC → GLB → Three.js 小型端到端實驗 | **WAIT P0 最低限度守門** | 保持原遊戲；先選車體代表性部件/小原型，保留可編輯 .blend、輪子 pivot、烤漆/光影、基本剛體變換、GLB、場內替換、Pixel 8 性能證據與可重做步驟；成功後再談正式車體量產 | Julia 規格、Codex 製作、Michael 驗收 |
| **P2** | 一組代表性景點 Asset → Package → Layout 試驗 | **WAIT P1/可並行研究** | 2–3 個小資產構成可重用 kit；重放與移動景點只改 layout，不修改模型/硬刻 HUD 公尺；有實際畫面、位置正確、光影/效能/原始檔、可重現；大型海岸重配需另行驗證 | Julia 規格、Codex 製作、Michael 驗收 |
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
