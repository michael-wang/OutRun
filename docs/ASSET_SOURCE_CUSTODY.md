# Asset Source Custody — 個人專案的 GitHub-first 資產版本管理

**生效：2026-11-21；Michael 核准簡單方案 A。** 本專案是個人 hobby project：對**已確認可公開、可合法收錄**的小型 Blender／原始美術／音訊工程檔，直接放進現有 public [OutRun Repo](https://github.com/michael-wang/OutRun) 的 `dev` 版本管理，與匯出結果、程式和測試一起維護。**不把 D: Asset Vault、第二套私有 Repo、雲端備份或 Git LFS 當成這項任務的先決條件。** 超大型或不適合公開的素材，才另議 Git LFS／私有存放；本許可不自動適用第三方／Hunyuan 來源、私人圖像或未核准內容。

## 唯一權威資產與本次 R6d 缺口

| 目的 | 路徑與狀態 |
| --- | --- |
| **預定 Git 原生母檔** | `art/source/characters/r6d-cover-locks.blend` — **尚待 Judy 從原工作區導入並 Push；目前不能聲稱已入庫。** |
| 目前 Windows 工作母檔 | `art-prototype/output/r6d-cover-locks.blend` — `.gitignore` 排除；保留原件，不移動／覆寫 |
| 已追蹤的遊戲髮型 | `public/assets/characters/coast-blonde-r6d.glb` — 現有接受版 |
| 已追蹤的製作腳本 | `scripts/blender/export_r6d_locks.py` — 讀取已追蹤的 `coast-blonde-r6b.glb` 與 `coast-blonde-r6b-upper.glb` |
| 資產登記 | [source-custody.json](../asset-pipeline/source-custody.json) — R6d 的原始 SHA-256 已由 Michael 的本機輸出提供，仍待 Git 入庫／真正開檔驗證 |

R6d 已通過使用者的**遊戲外觀**驗收；舊的 `asset-pipeline/pilot.json` 與 [P0 研究](ASSET_STORAGE_AND_RETENTION.md) 均是當時的技術快照（曾顯示 `source.file: null`），不代表現在要採用昂貴的多地儲存架構。R6f/R6g 仍屬歷史 QA 比較，並非預設遊戲頭髮。

## 誰負責？

| 職責 | 必要工作 |
| --- | --- |
| **Technical Artist / Codex** | 保存真正可編輯的來源、上游依賴、匯出腳本、授權資訊；不以 GLB 冒充母檔 |
| **Judy / Asset Librarian** | 盤點本機原檔；核對公開許可、SHA-256；複製到 Git 的 `art/source/`、提交／Push；確認遠端可讀；從**Git 版本**還原到新位置並在 Blender 開啟驗證，整理交接 |
| **Julia / Technical Reviewer** | 查驗 Manifest、實際 GitHub 提交、輸出雜湊／依賴、還原報告；判定來源流程可否結案，明確列出未知 |
| **Michael / Owner** | 決定最終外觀與何種原始素材可公開，不必追每次 `git add` |

**Source of Truth：** 小型且已核准公開的原生母檔 → GitHub `dev`。遊戲執行用的 GLB 仍放在 `public/assets/`。試驗輸出與快取仍可忽略，不能因為工作目錄在 `.gitignore` 中就永久不保管已驗收母檔。

## 每一個重要資產的簡單結案門檻

1. **確認來源與公開權利**：只選具明確許可的檔案，不做整個 `art-prototype/`／`art-prototype/output/` 一次性匯入。大型檔或授權存疑，保留本機並另列待決。
2. **Git Check-in**：採用固定可讀的 `art/source/<類別>/` 路徑，完整保留原始 bytes；計算 SHA-256 並更新 `asset-pipeline/source-custody.json`；與必要來源／匯出腳本關聯。使用常規 Git Commit + Push `dev`（不得碰 `main`），核實遠端 Commit 真的包含二進位原檔，而非只有 Manifest、Git LFS pointer 或一段本機路徑。
3. **還原／可編輯性**：從已提交的 Git Blob 或乾淨工作目錄副本還原到**新暫存位置**，用 Blender 真正開啟，檢查模型、必要骨架／材質，做小範圍可編輯性驗證；不要修改或覆蓋原母檔。若可以驗證重新匯出，記錄結果及是否與既有遊戲 GLB 一致；不能用檔案 hash 單獨宣稱 Blender 通過。
4. **Source Gate**：`npm run assets:source:check` 必須確認已固定雜湊與 Git HEAD 的原始內容一致；Judy 回報 Push 與 Blender 檢查證據、Julia 獨立檢視後，才能將保管狀態從 `PENDING_GIT_CHECKIN` 更新為 `GIT_TRACKED_VERIFIED` 並關閉交付任務。遊戲功能、美術、真機與公開商用權限屬不同 Gate，不自動視為通過。

**No forced second backup:** GitHub + 本機 Copy 對目前 hobby project 已是 Michael 選擇的合理版本化基礎。若未來要防範帳號失效、完整 Git 歷史遺失，再考慮額外獨立備份；這是升級選項，**不是目前 R6d 關卡的阻擋項**。

## R6d 本機交接（由 Judy 執行，非 Julia 雲端直接操作）

已由 Michael 在 Windows 上確認舊來源存在；SHA-256：

`5f45360a12be38a7a02777b5b9599964d051a05370f4ab5dd974e56c8017f261`

Judy 先 `git pull --ff-only origin dev`，在**沒有改動舊來源**的前提下複製：

```bash
mkdir -p art/source/characters
cp -n art-prototype/output/r6d-cover-locks.blend art/source/characters/r6d-cover-locks.blend
sha256sum art/source/characters/r6d-cover-locks.blend
npm run assets:source:test
```

這是備妥提交的初始步驟，不代表已經推送成功。確認來源和 Git 狀態後，僅 stage 許可的母檔及必要 Manifest 更新，再 Commit/Push。此時才執行 `npm run assets:source:check`，並從該 Commit 還原測試；詳見 [Issue #70](https://github.com/michael-wang/OutRun/issues/70)。

不得用 `git add -A`（可能把其他未追蹤私人素材一起加入），不得用 `git clean -fd`，不得刪除 `art-prototype/output/`。只有核准這份 R6d 原生母檔的公開許可；不推論為所有角色、車體、第三方照片、Hunyuan 模型的全面公開授權。
