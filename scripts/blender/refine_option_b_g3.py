"""G3: deform existing sculpt topology, never add overlay wheel brows.
Run Blender -b -P this.py -- preserved_G1.blend NEW_OUTPUT_DIR.
G1 is used deliberately: G2's disconnected shoulder overlays are not retained.
"""
import bpy, bmesh, sys, math, json, hashlib
from pathlib import Path
source,out=map(Path,sys.argv[sys.argv.index('--')+1:])
assert hashlib.sha256(source.read_bytes()).hexdigest()=='db70243ec4db7deed3ab531d9ce7b4b292c68a1eac97a44e75e34a5ddfc73fea'
out.mkdir(parents=True,exist_ok=True)
assert not (out/'option-b.blend').exists()
bpy.ops.wm.open_mainfile(filepath=str(source))
body=bpy.data.objects['option-b-body']
bm=bmesh.new();bm.from_mesh(body.data)
selected=[]
for v in bm.verts:
    x,y,z=v.co; cy=min((-1.38,1.45),key=lambda c:abs(y-c))
    r=math.hypot(y-cy,z-.46)
    if abs(x)>.75 and .47<r<.84:
        # Broad continuous quarter-panel transition within the source surface.
        # No overlapping patch, separate brow or duplicated face layer.
        t=max(0,min(1,(r-.515)/.325));w=1-t*t*(3-2*t)
        v.co.x=math.copysign(abs(x)*(1-w)+1.19*w,x)
        if any(e.is_boundary for e in v.link_edges) and r<.61:
            v.co.y=cy+(y-cy)*.515/r;v.co.z=.46+(z-.46)*.515/r
        selected.append(v)
for _ in range(3):
    interior=[v for v in selected if not any(e.is_boundary for e in v.link_edges)]
    bmesh.ops.smooth_vert(bm,verts=interior,factor=.35,use_axis_x=True,use_axis_y=True,use_axis_z=True)
bmesh.ops.dissolve_degenerate(bm,edges=list(bm.edges),dist=.00001)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.to_mesh(body.data);bm.free()
# Preserve source topology. Whole-surface voxel remeshing of this open sculpt
# was visually destructive; do not use it to conceal imperfect cut boundaries.
body.data.validate();body.data.update()
# G3 runtime rear assembly replaces the G1 rectangular placeholder completely.
old=bpy.data.objects.get('option-b-diffuser')
if old:bpy.data.objects.remove(old,do_unlink=True)
for p in body.data.polygons:p.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath=str(out/'option-b.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'option-b.glb'),export_format='GLB',export_cameras=False,export_lights=False)
(out/'recipe-result.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'blender':bpy.app.version_string,'modifiedSourceVertices':len(selected),'bodyFaces':len(body.data.polygons),'archPolicy':'source topology deformed and locally relaxed; no added overlay; cut-boundary imperfections remain','wheelOpeningRadius':.515},indent=2))
