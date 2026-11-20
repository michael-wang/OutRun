# Asset Source Custody — 可編輯美術母檔保護制度

**生效日期：2026-11-21。此文件是目前有效的製作規範，不是 P0 研究提案。** 適用於已驗收的主角、車輛、重要景點、音樂及其他難以重製的原始創作。舊有 P0 技術研究見 [ASSET_STORAGE_AND_RETENTION](ASSET_STORAGE_AND_RETENTION.md) 和 [ASSET_MANIFEST_PILOT](ASSET_MANIFEST_PILOT.md)，兩者都沒有證明真正的 Blender 母檔備份完成。

## 立即確認的缺口：R6d 女主角髮型

- 遊戲正式選用 R6d（R6f/R6g 只是可選 QA）。GLB `public/assets/characters/coast-blonde-r6d.glb`、匯出腳本 `scripts/blender/export_r6d_locks.py` 及 Spring Bone 遊戲程式已受 Git 追蹤。
- [R6d 報告](art-review/r6d/README.md) 指向本機可編輯來源 `art-prototype/output/r6d-cover-locks.blend`，但該路徑位於 `.gitignore` 的 `/art-prototype/output/` 之下。
- **補充：R6d 並非完全無法重建。** 實際的 `export_r6d_locks.py` 會讀取已追蹤的 `coast-blonde-r6b.glb` 和 `coast-blonde-r6b-upper.glb`，再產生新髮束；但必須實跑重建、核對輸出並保留可編輯 `.blend`，不能把「有腳本」直接等同於「原生母檔與依賴可恢復」。
- [P0 Manifest](../asset-pipeline/pilot.json) 將 `source.file` 明列為 `null`，證實當時**沒有在版控內核實這份母檔**；P0-3 也只測試少數已提交檔案的同機位元組還原。不能推論主人電腦上的 `.blend` 已遺失，也不能推論它已有獨立備份。
- [目前資產保管清單](../asset-pipeline/source-custody.json) 將它列為 `AT_RISK_UNVERIFIED`。這是**製作流程風險**，不撤回 Michael 對遊戲外觀的既有驗收。

## 角色責任（每一個重要資產都需要明確主人）

| 角色 | 必做事項 | 不得自稱完成的事情 |
| --- | --- | --- |
| **Technical Artist／Asset Producer（實作時通常是 Codex）** | 製作與保存原始 `.blend`、上游貼圖／參考／依賴、匯出 GLB、提供可重現命令與 SHA-256；在交付前整理工作區 | 不能把 GLB 或一個匯出腳本視為母檔已保存；不能只給絕對 C: 路徑就回報 SOURCE PASS |
| **Asset Librarian／Production Supervisor（Judy）** | 對每個重要資產建立/更新保管清單；核實來源、授權、版本、私有母檔、實際備份及從備份還原的證據；追蹤未完成項目並阻止錯誤結案 | 不得因為 `git status` 乾淨或母檔被 ignore 就批准清理；不得把同機複製當成異地備份 |
| **Technical Director／Independent Reviewer（Julia）** | 審查資產 ID、來源與匯出對應、清單、雜湊、測試及 Native Restore 證據；標記風險並決定工程門檻是否可信 | 未接觸 Windows 本機原檔，不能聲稱親自核實已備份、能編輯、可重建 |
| **Product Owner（Michael）** | 決定哪個美術版本被接受、私有儲存方案及公開／商用權限，處理必要預算 | 不需要逐個代替團隊備份 Blender 或追 Git 指令；美術 PASS 不等於可編輯來源保管 PASS |

**責任歸屬：** Producer 負責交付來源，Asset Librarian 對來源是否真正可再取得負最終流程責任，Julia 獨立 Review，Michael 只批准美術與權限。若任何角色不能存取實際來源／儲存地點，必須記錄 `UNKNOWN` 或 `BLOCKED_ASSET_CUSTODY`，不能靠文字報告替代證據。

## 每個重要資產的交付門檻

1. **WIP 可迭代：** Blender 母檔及其不可重建依賴先存成獨立命名的版本，不得只保留臨時 `.blend1` 或可隨時覆寫的工作檔。允許本機試玩，但需標示來源仍未驗證。
2. **候選交付（Asset Producer）：** 固定資產 ID、母檔版本/雜湊、原始輸入、使用工具版本、匯出腳本/設定、GLB 雜湊和授權來源。更新可公開的最小 Metadata；敏感絕對路徑、私有下載憑證或未獲准素材不得進公開 Repo。
3. **保管驗收（Asset Librarian）：** 在受控、**具有版本與不可覆寫歷史**的私人資產儲存庫／儲存空間保存母檔；另有可獨立取回的備份（優先離線或不同設備／地點）。檢查原件與備份 SHA-256；從備份還原至**新位置**，用 Blender 等原生軟體打開、檢查能修改，並做一次重匯出/匯入驗證。保留非敏感收據（資產 ID、版本、雜湊、測試日期、執行者與結果），避免公開實際私有路徑。
4. **獨立審查（Julia）：** 確認來源與輸出確實對應、收據不偷換模型，區分 `BYTE_COPY_VERIFIED`、`NATIVE_RESTORE_VERIFIED`、`INDEPENDENT_BACKUP_VERIFIED` 及 `UNKNOWN`。任何缺口必須寫在交接與 Issue；不允許把資產生產流程標記為完成。
5. **Goal 關閉或刪除 Worktree 前：** 有重要來源而未達保管門檻，標記 `BLOCKED_ASSET_CUSTODY` 並**保留來源**。可以保留 Michael 已接受的遊戲外觀，不必無故回滾可玩版本；但不得宣告「可重建資產/量產流程 PASS」，也不能清空不可再取得的來源。

**公開權限邊界：** 主 GitHub Repo 是公開的。需要保護的 `.blend`、Hunyuan 原始 GLB、私人圖片/貼圖、授權限制的第三方來源應使用經 Michael 批准的**私有**資產儲存，而不是為了讓檔案被 Git 追蹤就自動提交到 public repo。Git LFS 仍需核實實際物件與備份，不能只提交 LFS 指標或依賴單一雲端同步資料夾。

## 最小化工具（可在 Windows Git Bash 執行）

目前的 `asset-pipeline/source-custody.json` 只包含 **R6d 試點**，不是整個遊戲的完整來源清單。

```bash
# 只讀檢查：正式 GLB 是否對上已知 hash、可編輯母檔是否真的可讀
npm run assets:source:audit

# 找到本機母檔後，先核對它的 SHA-256
sha256sum art-prototype/output/r6d-cover-locks.blend

# 把算出的母檔 SHA-256 固定到 source-custody.json，
# 再把該版本母檔複製到經批准、Repo 之外、具有保留歷史的私人儲存。
# 由本機 Codex/Judy 依實際備份位置執行位元組核對（下行 D:/... 僅是範例）：
node scripts/audit-source-custody.mjs --asset r6d-hair --backup 'D:/YOUR-PRIVATE-ASSET-VAULT/r6d-cover-locks.blend' --strict

# 只跑工具回歸測試（不需 Blender）
npm run assets:source:test
```

`assets:source:audit` 為**非阻擋盤點**，會明確輸出 `AT_RISK` 而不是假 PASS；`--strict` 在未固定母檔 SHA、找不到來源或備份不符時會以非零碼失敗。通過 strict **只證明兩份可存取檔案和已記錄雜湊一致**，不代表獨立設備／異地備份、原生可編輯、來源授權或重新匯出已通過，以上仍由保管負責人交證據、Julia 審查。

**遷移策略：** 先補 R6d，再盤點目前玩家主車、R7H 女伴母檔和未來其他 Hero Asset。建立來源鏈與獨立備份後，才針對相關原型目錄進行刪除或歸檔。不要對既有未核實資產直接掛上全域 `verify:dev` 阻擋導致遊戲無法開發；新重要資產的 Goal Closeout 則要逐件執行嚴格保管檢查與人工 native restore。
