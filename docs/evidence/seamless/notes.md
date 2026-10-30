# Seamless banking (Goal A)

Baseline: 6b744b8. No screenshots were attached to this request in the available
conversation, so matched before/after evidence uses the supplied Seed 1 distances
620/1930 m, also checking +350 m in case those referred to distance travelled.

The transverse tan bands reproduced before the change were underlying sand:
the wide sand ribbon and narrower asphalt ribbon triangulated a twisting surface
differently. r4 splits sand at the asphalt edges, making the underlying triangles
identical and 0.1 m lower. This fixes the geometry rather than covering it.
Independent chunk normals were a separate potential shading seam; r4 calculates
strip normals from absolute surface derivatives across chunk boundaries.

r4 / ALB4 preserves centerline, widths and elevation. Ordinary bank demand receives
two 125 m radius distance filters; cubic interpolation gives continuous slope.
Showcases retain their peak angles with 300 m quintic entry/exit ramps, extended
200 m beyond the old feature boundaries. Short gaps can retain bank rather than
returning abruptly to flat. No handling or collision changes. r1/r2/r3 recipes and
their original road preparation remain selectable via historical Trip Codes.

Build passed (existing bundle size warning). 12 focused unit tests passed, including
all-route Seeds 1/2/7 continuity, matching boundary normals and underlay separation.
Four Trip browser regressions passed. Recorded normal-chase gameplay crosses
560–2354 m at approximately 270 km/h; the matched screenshots and recording frames
were inspected. Settled FPS approximately 60 in Edge 960×432 DPR2 with 4× CPU
throttling, desktop GPU. No streaming gaps; measured player contact error <0.001 m.
The recording is canvas-only, without audio/DOM HUD. Physical Pixel 8 acceptance
remains pending. See contacts.json for multi-seed chunk/showcase contact checks.
