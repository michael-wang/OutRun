# Grand Canyon · Grand Curves v3 → Blender terrain pass

## Road is the source of truth

Play at `?showcase=canyon&road=lock`. This **overwrites** the prior Road
Lock design. 5.65km, four one-way lanes, white lane separators, no double
yellow, no standard traffic or cones. Three 34–36° banked C08 hairpins
remain exactly where they were. The short, repeated left/right flicks
(C07) are replaced by **single long C02 sweeps** and just **two roomy C06
S-bends**, giving the player time to commit to a turn. The severe
climbs/descents are retained.

### Intended geography and visual rhythm

| Road-relative m | Driving | Geography for Blender |
|---|---|---|
| 0–340 | One committed approach curve | Close canyon walls; conceal incomplete distance |
| **340–870** | **Hero 1: left 180° banked hairpin** | Open a wide valley as the road turns; broad visible opposing escarpment |
| 930–1370 | Continuous right-hand canyon sweeper | Travel around a mountain spur rather than weaving among arbitrary cones |
| **1430–1970** | **Hero 2: right 180° banked hairpin** | Dramatic outer ledge, river and previous road glimpsed at a different elevation |
| 2050–2590 | One big S, no four-flick oscillation | Two adjacent cut slopes, then valley reveal |
| **2670–3230** | **Hero 3: high left 180° banked hairpin** | High plateau, far vistas, road below. Hero vista must fall into normal chase view |
| 3340–3900 | Long right sweeper | Open, breathable wide silhouette, still sustained steering |
| 4010–4560 | One large S across a steep descent | Near cliff then opposing wide canyon wall; use rock to hide incomplete backdrop |
| 4670–5590 | Two opposite long bends with one clear reversal | Progressive exit reward; no small jitter or kilometer-long straight |

**No new road tweaks until the scenery playtest reveals a concrete need.**

## Immediately move into Blender (next stage)

From updated `dev` on the local Windows machine, run:

```powershell
npm run art:roadlock
```

This exports `art-prototype/output/roadlock-road-reference.json` containing
the **exact full 5.65km game track** (10m samples), road-protection
coordinates (5m samples), and **nine fixed chase-camera positions** for
the three heroes. It DOES NOT build or overwrite the old 400m .blend.

### Codex/Blender brief: scenic graybox before polish

1. Use the exported centerline, height, banking and 14m-wide driving
   envelope as absolute constraints. **Track first, landscape second.**
   Reuse useful rock meshes from v2, but NEVER load the old GLB unchanged.
2. Build the complete route's **coarse** terrain in Blender:
   three distinctive large canyon basins/terraces around the three heroes,
   and mostly simple continuous rocky corridors in between. Keep the
   environment in world coordinates, considering adjacent switchback
   road levels together. Do not generate independent hills around each
   road segment that might overlap on hairpins.
3. Use close cliff walls and foreground ridges to hide incomplete terrain
   without colliding with the road or obstructing the player camera.
   Hero bends must be intentionally **open**, with distant mesas,
   height separation and some suggestion of valley depth.
4. Make the three hero compositions readable from normal chase cameras.
   A static screenshot that cannot see the payoff is a failed composition;
   move the art, NOT the camera/road. Start with nine 16:9 captures.
5. Before any stone details, bring a **local GLB art-only export** into the
   roadlock route (new toggle `&art=blender` if needed). Drive the entire
   route at normal speed and fix visible clipping, exposed voids and
   jarring scene joins. This is a single one-minute arcade level, not
   a realistic continent simulation.
6. Keep work on local `art-prototype/output/` and `dev`. Don't commit
   large GLB/blend/videos. Don't touch `main`; don't run CI unless the
   actual driving reveals a concrete failure.

**The output we need is an editable full-route .blend, art-only GLB,
nine hero viewpoint images and one continuous playable roadlock recording.**
Don't spend time adding more generative rules, new editor architecture or
realistic physics. The only success criterion is the driving experience
*with* terrain.
