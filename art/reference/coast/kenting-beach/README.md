# P2-G1｜墾丁海水浴場・原始設計圖（2026-11-17）

**原圖已於 2026-11-18 經 Michael 授權，正式納入 `dev` 公開 repo。** 不必再從 Julia 設計頁或過去的 ZIP 手工轉存這六張圖。此目錄是可核驗的美術參考來源，**不是目前路線幾何或 3D 完工證據**。

來源：[Julia 原始五張設計板＋Michael 道路草圖](https://chatgpt.com/space/page_b61e7b0d270081918ca2e58abc96a9cb)；背景：[海水浴場規格](../../../../docs/COAST_KENTING_BEACH_BRIEF.md)／[Issue #67](https://github.com/michael-wang/OutRun/issues/67)。每張 PNG 與來源頁的 SHA-256 已逐一對照；確切位元組和雜湊記於 [manifest.json](manifest.json)。

## 目錄

| 設計圖 | 用途 |
| --- | --- |
| [00 — 量測約束配置](00-site-layout-survey-constrained.png) | 基於當時路／岸調查的地點草圖；比 AI 概念板更適合作為原始左右方位參考。 |
| [01 — 全區美術方向](01-overall-art-direction.png) | 墾丁記憶、夕陽、沙灘／海水、彩傘、救生台與白燈塔的色彩和氛圍。 |
| [02 — 玩家視線故事板](02-player-sightline-storyboard.png) | approach → hero moment → exit 的戲劇節奏；不是實際遊戲鏡頭。 |
| [03 — 關鍵物件與分區](03-key-assets-and-zones.png) | 救生台、彩傘群、遊客、淺海泳客及燈塔的配置參考。 |
| [04 — Look-dev／資產參考](04-lookdev-and-asset-reference.png) | 個別物件外觀與風格，供後續獨立 GLB／Blender 工作使用；不能直接當 Hunyuan 的乾淨單物件輸入。 |
| [05 — Michael 的揭幕道路草圖](05-michael-approach-sketch.png) | A 樹林遮蔽、B 山坡遮蔽的原始想法；之後已進入多輪可駕駛 Macro 修訂。 |

## 視覺與施工優先權

1. **圖紙 00 的歷史測量與實際最新遊戲路段資料優先於 01–04 的幻想幾何。** 01–04 為 AI 原創概念插畫，部分將**左海側燈塔錯畫到道路右側**；不得依這些錯置直接配置。
2. 圖紙最初圍繞 `beach-market` track **5,980m = HUD 5,630m** 候選製作。後續 `beachMacro=right`、夕陽朝向、海岸貼近、`beachPlan=1` 等屬 **Issue #67 最新本機 Macro 工作**。與其不同時，**以最新經驗／Macro 實際可駕駛版本及 Michael 驗收為準**；不要從靜態圖回推最終物件座標。
3. 保留 Asset Library → Scenic Package → Stage Layout 分層、左海側沙／濕砂／入水海岸、真正在水中的泳客、燈塔／海鷗、護欄安全、Ultra Water 岸線匹配。即使景點可移動，移址後的地形和水線仍需重新適配。
4. 這是**設計素材公開授權**，不是 `main` 發布核准，也不是私人混元車／第三方照片或外部攝影素材公開許可。私人 3D 來源、受地域限制的 AI 模型和第三方白燈塔照片**不在本次提交**。
5. **完成狀態：** 本目錄的圖可直接查閱與下載；不代表 3D 資產、正式賽道、Pixel 8 或人類遊玩感受已通過最終驗收。Issue #67 的實作與驗收紀錄另行管理。

後續設計圖可直接進本目錄或相應 `art/reference`，連同原始 PNG、雜湊、版本、用途與採用狀態；過去的設計板保留歷史，不強制當成最新版本。
