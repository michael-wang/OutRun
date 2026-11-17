"""G2 local wheel-cut boundary refinement; input is preserved G1 Blender copy.
blender -b -P scripts/blender/refine_option_b_g2.py -- G1.blend NEW_OUTPUT_DIR
"""
import bpy, bmesh, sys, hashlib, json, math
from pathlib import Path
source, output=map(Path,sys.argv[sys.argv.index('--')+1:])
assert hashlib.sha256(source.read_bytes()).hexdigest()=='db70243ec4db7deed3ab531d9ce7b4b292c68a1eac97a44e75e34a5ddfc73fea'
output.mkdir(parents=True,exist_ok=True)
assert not (output/'option-b.glb').exists(), 'Use a new output directory'
bpy.ops.wm.open_mainfile(filepath=str(source))
body=bpy.data.objects['option-b-body']
bm=bmesh.new();bm.from_mesh(body.data)
changed=0
for v in bm.verts:
    x,y,z=v.co
    if abs(x)<.71 or not any(e.is_boundary for e in v.link_edges): continue
    cy=min((-1.38,1.45),key=lambda c:abs(y-c))
    r=math.hypot(y-cy,z-.46)
    if .47<r<.61:
        # Relax only the cut boundary into a consistent wheel opening.
        v.co.y=cy+(y-cy)*.515/r
        v.co.z=.46+(z-.46)*.515/r
        changed+=1
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
bm.to_mesh(body.data);bm.free()
# Model a broad shoulder into the existing fender, not a separate tubular brow.
# At the inboard edge it overlaps the sculpt; the wheel-side edge has 55mm
# radial clearance and a 150mm-wide tire envelope. This is local editable mesh.
verts=[];faces=[]
for side in (-1,1):
    for cy in (-1.38,1.45):
        start=len(verts);steps=40;rows=6
        for i in range(steps+1):
            a=-.24+(math.pi+.48)*i/steps
            for j in range(rows+1):
                t=j/rows;r=.515+.125*t
                x=side*(1.205-.50*(t*t*(3-2*t)))
                verts.append((x,cy+math.cos(a)*r,.46+math.sin(a)*r))
        for i in range(steps):
            for j in range(rows):
                n=start+i*(rows+1)+j
                f=(n,n+1,n+rows+2,n+rows+1)
                faces.append(f if side>0 else tuple(reversed(f)))
mesh=bpy.data.meshes.new('G2 integrated shoulder topology');mesh.from_pydata(verts,[],faces);mesh.update()
shoulder=bpy.data.objects.new('G2 integrated fender shoulders',mesh);bpy.context.collection.objects.link(shoulder)
shoulder.data.materials.append(body.data.materials[0])
for f in shoulder.data.polygons:f.use_smooth=True
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);shoulder.select_set(True);bpy.context.view_layer.objects.active=body;bpy.ops.object.join()
bpy.ops.wm.save_as_mainfile(filepath=str(output/'option-b.blend'))
bpy.ops.export_scene.gltf(filepath=str(output/'option-b.glb'),export_format='GLB',export_cameras=False,export_lights=False)
(output/'recipe-result.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'boundaryVerticesAdjusted':changed,'wheelOpeningRadius':.515,'bodyFaces':len(body.data.polygons),'blender':bpy.app.version_string},indent=2))
